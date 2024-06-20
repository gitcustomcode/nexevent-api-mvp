import {  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/services/prisma.service';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';
import { EventCreateDto } from './dto/event-producer-create.dto';
import { generateSlug } from 'src/utils/generate-slug';
import {
  EventDashboardResponseDto,
  FindOneDashboardParticipantPanelDto,
  GeneralDashboardResponseDto,
  ResponseEventParticipants,
  ResponseEvents,
  EventDashboardPanelFinancialDto,
} from './dto/event-producer-response.dto';
import {
  StorageService,
  StorageServiceType,
} from 'src/services/storage.service';
import { randomUUID } from 'crypto';
import { PaginationService } from 'src/services/paginate.service';
import {
  EventParticipantHistoricStatus,
  EventType,
  Prisma,
} from '@prisma/client';
import { EventTicketProducerService } from '../event-ticket/event-ticket-producer.service';
import { EventTicketCreateDto } from '../event-ticket/dto/event-ticket-producer-create.dto';
import {
  EventProducerUpdateDto,
  EventProducerUpgradeDto,
} from './dto/event-producer-update.dto';
import {
  StateSumsFunc,
  getMaxParticipantsState,
  getMaxSalesState,
} from 'src/utils/test';
import { StripeService } from 'src/services/stripe.service';
import { concatTitleAndCategoryEvent } from 'src/utils/concat-title-category-event';
import { isArray } from 'class-validator';

type DataItem = {
  state: string | null;
  ticketValue: number;
};

type StateSums = {
  [key: string]: {
    count: number;
    ticketSum?: number;
  };
};

@Injectable()
export class EventProducerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userProducerValidationService: UserProducerValidationService,
    private readonly storageService: StorageService,
    private readonly paginationService: PaginationService,
    private readonly eventTicketProducerService: EventTicketProducerService,
    private readonly stripe: StripeService,
  ) {}

  async createEvent(email: string, body: EventCreateDto): Promise<object> {
    try {
      const {
        category,
        endAt,
        endPublishAt,
        eventConfig,
        eventSchedule,
        location,
        startAt,
        startPublishAt,
        title,
        eventTickets,
        eventPublic,
        latitude,
        longitude,
        description,
        sellOnThePlatform,
        address,
        city,
        complement,
        country,
        district,
        number,
        state,
      } = body;

      if (startAt > endAt) {
        throw new BadRequestException(
          'O horário de início não pode ser maior que o horário de término',
        );
      }

      if (location === 'DEFINED' && (!latitude || !longitude)) {
        throw new BadRequestException(
          'É necessário informar latitude e longitude para o local definido',
        );
      }

      if (location === 'ONLINE') {
        eventConfig.credentialType = 'QRCODE';
        eventConfig.printAutomatic = false;
      }

      let taxToClient = false;

      eventTickets.map((ticket) => {
        let firstBatch = null;
        let endPublishAt = null;

        ticket.eventTicketPrices.map((price) => {
          if (price.endPublishAt && price.startPublishAt) {
            if (price.startPublishAt > price.endPublishAt) {
              throw new ConflictException(
                `A data inicial de publicação do lote ${price.batch} é maior ou igual a data final de publicação`,
              );
            }

            if (firstBatch === null) {
              firstBatch = price.batch;
              endPublishAt = price.endPublishAt;
            } else {
              if (price.batch > firstBatch) {
                if (new Date(price.startPublishAt) < new Date(endPublishAt)) {
                  throw new BadRequestException(
                    `O lote ${firstBatch} tem uma data final de publicação menor à data inicial de publicação do lote ${price.batch}`,
                  );
                }
              }
              firstBatch = price.batch;
              endPublishAt = price.endPublishAt;
            }
          }

          if (taxToClient != price.passOnFee && taxToClient != true) {
            taxToClient = price.passOnFee;
          }
        });

        ticket.eventTicketDays.map((day) => {
          if (day.date > startAt && day.date < endAt) {
            throw new ConflictException(
              'O ingresso possui um ou mais dias que não estão no periodo do evento',
            );
          }
        });

        if (ticket.isBonus && ticket.eventTicketPrices.length > 1) {
          throw new ConflictException(
            'Ingressos bonus não podem ter mais de 1 valor ou lote',
          );
        }
      });

      const milliseconds = new Date().getTime();
      const slug = generateSlug(`${title} ${milliseconds}`);

      const user = await this.userProducerValidationService.eventNameExists(
        email.toLowerCase(),
        slug,
      );

      const sequential = await this.prisma.event.count({
        where: {
          userId: user.id,
        },
      });

      const eventScheduleFormatted = eventSchedule.map((schedule) => {
        return {
          date: schedule.date,
          startHour: schedule.startHour,
          endHour: schedule.endHour,
          description: schedule.description,
        };
      });

      let stripeCheckoutUrl = null;
      let stripeCheckoutValue = 0;
      let eventLimit = 20;
      let eventType: EventType = 'FREE';
      let ticketPriceNegative = false;

      const printAutomatic = eventConfig.printAutomatic ? 2 : 0;
      const credentialType = eventConfig.credentialType;
      const credential =
        credentialType === 'QRCODE'
          ? 1
          : credentialType === 'FACIAL'
            ? 4
            : credentialType === 'FACIAL_IN_SITE'
              ? 3
              : 0;

      const fee = printAutomatic + credential;

      eventTickets.map((ticket) => {
        ticket.eventTicketPrices.map((ticketPrice) => {
          eventLimit += ticketPrice.guests;
          const price = ticketPrice.price;

          ticketPrice.passOnFee;

          if (
            price - fee < 0 &&
            !ticketPrice.passOnFee &&
            ticket.isBonus === false
          ) {
            ticketPriceNegative = true;
          }
        });
      });

      if ((!taxToClient && eventLimit > 20) || ticketPriceNegative) {
        const checkoutSession = await this.stripe.checkoutSessionEventProducer(
          eventLimit,
          eventConfig.printAutomatic,
          eventConfig.credentialType,
        );
        eventType = 'PAID_OUT';
        stripeCheckoutUrl = checkoutSession.sessionUrl;
        stripeCheckoutValue = checkoutSession.value;
      } else {
        eventType = 'PASSED_CLIENT';
      }

      const fullySearch = concatTitleAndCategoryEvent(title, category);

      const createdEvent = await this.prisma.event.create({
        data: {
          userId: user.id,
          slug: slug,
          sequential: sequential + 1,
          title: title,
          description: description,
          category: category,
          location: location,
          public: eventPublic,
          type: eventType,
          startAt: startAt,
          endAt: endAt,
          startPublishAt: startPublishAt,
          endPublishAt: endPublishAt,
          fullySearch: fullySearch,
          latitude: latitude,
          longitude: longitude,
          sellOnThePlatform: sellOnThePlatform,
          checkoutUrl: stripeCheckoutUrl,
          paymentStatus: 'unpaid',
          address,
          city,
          complement,
          country,
          district,
          number,
          state,
          eventSchedule: {
            createMany: {
              data: eventScheduleFormatted,
            },
          },
          eventConfig: {
            create: {
              printAutomatic: eventConfig.printAutomatic,
              credentialType: eventConfig.credentialType,
              limit: eventLimit,
            },
          },
        },
      });

      if (stripeCheckoutUrl) {
        await this.prisma.balanceHistoric.create({
          data: {
            userId: user.id,
            paymentId: stripeCheckoutUrl,
            eventId: createdEvent.id,
            value:
              stripeCheckoutValue > 0
                ? Number(stripeCheckoutValue / 100).toFixed(2)
                : stripeCheckoutValue,
          },
        });
      }

      for (const ticket of eventTickets) {
        const body: EventTicketCreateDto = {
          title: ticket.title,
          description: ticket.description,
          isFree: ticket.isFree,
          isPrivate: ticket.isPrivate,
          eventTicketPrices: ticket.eventTicketPrices,
          eventTicketBonuses: ticket.eventTicketBonuses,
          eventTicketDays: ticket.eventTicketDays,
          isBonus: ticket.isBonus,
        };

        await this.eventTicketProducerService.createEventTicket(
          email,
          createdEvent.slug,
          body,
        );
      }

      return {
        id: createdEvent.id,
        slug: createdEvent.slug,
        stripeCheckoutUrl: stripeCheckoutUrl,
      };
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw error;
    }
  }

  async updateEvent(email: string, slug: string, body: EventProducerUpdateDto) {
    try {
      const user =
        await this.userProducerValidationService.validateUserProducerByEmail(
          email.toLowerCase(),
        );

      const event = await this.prisma.event.findUnique({
        where: {
          slug: slug,
          userId: user.id,
        },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const {
        category,
        description,
        endAt,
        endPublishAt,
        location,
        eventPublic,
        startAt,
        startPublishAt,
        title,
        latitude,
        longitude,
      } = body;

      if (location === 'DEFINED' && (!latitude || !longitude)) {
        throw new BadRequestException(
          'É necessário informar latitude e longitude para o local definido',
        );
      }

      const fullySearch = concatTitleAndCategoryEvent(
        title ? title : event.title,
        category ? category : event.category,
      );

      await this.prisma.event.update({
        where: {
          id: event.id,
        },
        data: {
          category: category ? category : event.category,
          description: description ? description : event.description,
          endAt: endAt ? endAt : event.endAt,
          endPublishAt: endPublishAt ? endPublishAt : event.endPublishAt,
          fullySearch,
          location: location ? location : event.location,
          public: eventPublic ? eventPublic : event.public,
          startAt: startAt ? startAt : event.startAt,
          startPublishAt: startPublishAt
            ? startPublishAt
            : event.startPublishAt,
          title: title ? title : event.title,
          latitude: latitude ? latitude : event.latitude,
          longitude: longitude ? longitude : event.longitude,
        },
      });

      return `Event updated successfully`;
    } catch (error) {
      throw error;
    }
  }

  async findOneDashboard(
    email: string,
    slug: string,
  ): Promise<EventDashboardResponseDto> {
    try {
      const user =
        await this.userProducerValidationService.validateUserProducerByEmail(
          email.toLowerCase(),
        );

      const event = await this.prisma.event.findUnique({
        where: {
          slug: slug,
          userId: user.id,
        },
        include: {
          eventTicket: {
            include: {
              eventTicketPrice: true,
              eventTicketGuest: true,
              EventParticipant: {
                include: {
                  user: true,
                  eventParticipantHistoric: {
                    orderBy: { createdAt: 'desc' },
                  },
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          eventParticipant: {
            include: {
              user: {
                include: {
                  userSocials: {
                    where: {
                      username: { not: '' },
                    },
                  },
                  userFacials: {
                    orderBy: {
                      createdAt: 'desc',
                    },
                  },
                },
              },
              eventParticipantHistoric: true,
              eventTicket: true,
              eventTicketPrice: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          eventConfig: true,
          EventStaff: {
            orderBy: {
              id: 'desc',
            },
          },
          eventTerm: {
            include: {
              term: true,
            },
          },
          BalanceHistoric: {
            include: {
              eventTicket: true,
            },
          },
        },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const checkInArr = new Map<
        string,
        { participantId: string; status: string }
      >();

      const eventTicketsArr = new Map<
        string,
        { ticketId: string; price: number; title: string }
      >();

      const eventTicketPercentualSellArr = new Map<
        string,
        { title: string; qtd: number; limit: number }
      >();

      const salesByDayMap = new Map<string, number>();

      event.eventTicket.forEach((ticket) => {
        eventTicketsArr.set(ticket.id, {
          ticketId: ticket.id,
          price: 0,
          title: ticket.title,
        });

        eventTicketPercentualSellArr.set(ticket.title, {
          title: ticket.title,
          qtd: 0,
          limit: ticket.guests,
        });
      });

      event.eventParticipant.forEach((participant) => {
        participant.eventParticipantHistoric.forEach((historic) => {
          if (historic.status === 'CHECK_IN') {
            if (!checkInArr.has(historic.eventParticipantId)) {
              checkInArr.set(historic.eventParticipantId, {
                participantId: historic.eventParticipantId,
                status: historic.status,
              });
            }
          }
        });

        if (eventTicketsArr.has(participant.eventTicketId)) {
          const ticket = eventTicketsArr.get(participant.eventTicketId);
          if (ticket) {
            ticket.price += Number(participant.eventTicketPrice.price);
            eventTicketsArr.set(participant.eventTicketId, ticket);
          }
        }
      });

      event.BalanceHistoric.map((balance) => {
        const value = Number(balance.value);
        if (value > 0) {
          const date = balance.createdAt.toISOString().split('T')[0];

          if (salesByDayMap.has(date)) {
            salesByDayMap.set(date, salesByDayMap.get(date)! + value);
          } else {
            salesByDayMap.set(date, value);
          }
        }

        if (balance.eventTicketId) {
          if (eventTicketPercentualSellArr.has(balance.eventTicket.title)) {
            const ticket = eventTicketPercentualSellArr.get(
              balance.eventTicket.title,
            );
            if (ticket) {
              ticket.qtd += 1;
              eventTicketPercentualSellArr.set(
                balance.eventTicket.title,
                ticket,
              );
            }
          }
        }
      });

      const uniqueCheckInArr = Array.from(checkInArr.values());
      const eventTickets = Array.from(eventTicketsArr.values());
      const sellDiary = Array.from(salesByDayMap, ([date, total]) => ({
        date,
        total,
      }));
      const eventTicketPercentualSell = Array.from(
        eventTicketPercentualSellArr.values(),
      ).map((ticket) => {
        return {
          title: ticket.title,
          percentual:
            (ticket.qtd / ticket.limit) * 100
              ? (ticket.qtd / ticket.limit) * 100
              : 0,
        };
      });

      let eventTotal = 0;
      eventTicketsArr.forEach((ticket) => {
        eventTotal += ticket.price;
      });

      const response: EventDashboardResponseDto = {
        id: event.id,
        title: event.title,
        slug: event.slug,
        status: event.status,
        eventStaff: event.EventStaff.length,
        eventViews: event.viewsCount,
        eventCity: event.city,
        eventState: event.state,
        startAt: event.startAt,

        eventParticipantsCount: event.eventParticipant.length,
        eventParticipantLimitCount: event.eventConfig[0].limit,
        eventParcitipantAccreditationsCount: uniqueCheckInArr.length,
        eventParcitipantAccreditationsPercentual:
          (uniqueCheckInArr.length / event.eventParticipant.length) * 100,

        eventTotal: eventTotal,
        eventTickets: eventTickets,

        eventTicketPercentualSell: eventTicketPercentualSell,

        sellDiary: sellDiary,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async findOneDashboardParticipantPanel(
    email: string,
    slug: string,
  ): Promise<FindOneDashboardParticipantPanelDto> {
    try {
      const user =
        await this.userProducerValidationService.validateUserProducerByEmail(
          email.toLowerCase(),
        );

      const event = await this.prisma.event.findUnique({
        where: {
          slug: slug,
          userId: user.id,
        },
        include: {
          eventParticipant: {
            include: {
              user: {
                include: {
                  userSocials: {
                    where: {
                      username: { not: '' },
                    },
                  },
                  userFacials: {
                    orderBy: {
                      createdAt: 'desc',
                    },
                  },
                },
              },
              eventParticipantHistoric: true,
              eventTicket: true,
              eventTicketPrice: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          eventConfig: true,
        },
      });

      let eventParticipantsCount = 0;
      let eventParticipantAwaitPayment = 0;

      const listParticipants = new Map<
        string,
        {
          participantId: string;
          name: string;
          ticketName: string;
          checkInDate: Date;
          payment: boolean;
        }
      >();

      const checkInArr = new Map<
        string,
        { participantId: string; status: string }
      >();

      event.eventParticipant.forEach((participant) => {
        if (participant.status !== 'AWAITING_PAYMENT') {
          eventParticipantsCount += 1;
        } else {
          eventParticipantAwaitPayment += 1;
        }

        if (!listParticipants.has(participant.id)) {
          listParticipants.set(participant.id, {
            participantId: participant.id,
            name: participant.user.name,
            ticketName: participant.eventTicket.title,
            checkInDate: null,
            payment: participant.status !== 'AWAITING_PAYMENT' ? true : false,
          });
        }

        participant.eventParticipantHistoric.forEach((historic) => {
          if (historic.status === 'CHECK_IN') {
            if (!checkInArr.has(historic.eventParticipantId)) {
              checkInArr.set(historic.eventParticipantId, {
                participantId: historic.eventParticipantId,
                status: historic.status,
              });

              if (listParticipants.has(historic.eventParticipantId)) {
                const existingParticipant = listParticipants.get(
                  historic.eventParticipantId,
                );
                existingParticipant.checkInDate = historic.createdAt;
                listParticipants.set(
                  historic.eventParticipantId,
                  existingParticipant,
                );
              } else {
                listParticipants.set(historic.eventParticipantId, {
                  participantId: historic.eventParticipantId,
                  name: participant.user.name,
                  ticketName: participant.eventTicket.title,
                  checkInDate: historic.createdAt,
                  payment:
                    participant.status !== 'AWAITING_PAYMENT' ? true : false,
                });
              }
            }
          }
        });
      });

      const uniqueCheckInArr = Array.from(checkInArr.values());

      const perMinute = parseFloat((uniqueCheckInArr.length / 60).toFixed(2));

      const response: FindOneDashboardParticipantPanelDto = {
        eventLimit: event.eventConfig[0].limit,
        eventParticipantsCount: eventParticipantsCount,
        eventParticipantAwaitPayment: eventParticipantAwaitPayment,

        eventParcitipantAccreditationsCount: uniqueCheckInArr.length,
        eventParcitipantAccreditationsPercentual:
          (uniqueCheckInArr.length / event.eventParticipant.length) * 100,
        eventParticipantAccreditationsPerMinute: perMinute,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async findAllEvents(
    email: string,
    page: number,
    perPage: number,
    searchable?: string,
    status?: string,
  ): Promise<ResponseEvents> {
    try {
      const user =
        await this.userProducerValidationService.validateUserProducerByEmail(
          email.toLowerCase(),
        );

      const where: Prisma.EventWhereInput = {
        userId: user.id,
      };

      if (searchable) {
        where.fullySearch = { contains: searchable, mode: 'insensitive' };
      }

      if (status) {
        where.status = status === 'ENABLE' ? 'ENABLE' : 'DISABLE';
      }

      const event = await this.prisma.event.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: Number(perPage),
        skip: (page - 1) * Number(perPage),
      });

      const totalItems = await this.prisma.event.count({ where });

      const pagination = await this.paginationService.paginate({
        page,
        perPage: perPage,
        totalItems,
      });

      const events = event.map((event) => {
        return {
          id: event.id,
          title: event.title,
          slug: event.slug,
          photo: event.photo,
          startAt: event.startAt,
        };
      });

      const response: ResponseEvents = {
        data: events,
        pageInfo: pagination,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async updatePhotoEvent(
    email: string,
    eventId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    await this.userProducerValidationService.validateUserProducerByEmail(
      email.toLowerCase(),
    );
    const currentDate = new Date();
    const year = currentDate.getFullYear().toString();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');

    const uniqueFilename = `${randomUUID()}-${file.originalname}`;
    const photoPath = `${year}/${month}/${day}/${uniqueFilename}`;

    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      throw new NotFoundException('Account not make a event');
    }

    this.storageService.uploadFile(
      StorageServiceType.S3,
      photoPath,
      file.buffer,
    );

    await this.prisma.event.update({
      where: { id: eventId },
      data: { photo: photoPath },
    });

    return 'Event photo uploaded';
  }

  async createEventTerms(
    email: string,
    eventId: string,
    name: string,
    signature: string,
    file: Express.Multer.File,
  ): Promise<string> {
    try {
      await this.userProducerValidationService.validateUserProducerByEmail(
        email.toLowerCase(),
      );

      const event = await this.prisma.event.findUnique({
        where: {
          id: eventId,
        },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const deadlineAt = new Date();

      deadlineAt.setDate(deadlineAt.getDate() + 30);

      const formattedDeadline = deadlineAt.toISOString();

      const termCreated = await this.prisma.term.create({
        data: {
          deadlineAt: formattedDeadline,
          name: name,
          path: name,
        },
      });

      await this.uploadEventTerms(termCreated.id, file);

      await this.prisma.eventTerm.create({
        data: {
          eventId: eventId,
          termId: termCreated.id,
          signature: signature === 'true' ? true : false,
        },
      });

      return 'Event terms created successfully';
    } catch (error) {
      throw error;
    }
  }

  async uploadEventTerms(documentAndTermId: string, file: Express.Multer.File) {
    try {
      const allowedMimeTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          'Only PDF and Word (DOCX) files are allowed.',
        );
      }

      const currentDate = new Date();
      const year = currentDate.getFullYear().toString();
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const day = currentDate.getDate().toString().padStart(2, '0');

      const filename = file.originalname;
      const fileExtension = filename.split('.').pop();

      const uniqueFilename = `${randomUUID()}.${fileExtension}`;

      const filePath = `document-and-term/${year}/${month}/${day}/${uniqueFilename}`;

      this.storageService.uploadFile(
        StorageServiceType.S3,
        filePath,
        file.buffer,
      );

      const response = await this.prisma.term.update({
        where: {
          id: documentAndTermId,
        },
        data: {
          path: filePath,
        },
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  async generalDashboard(email: string): Promise<GeneralDashboardResponseDto> {
    try {
      const user = await this.userProducerValidationService.findUserByEmail(
        email.toLowerCase(),
      );

      const events = await this.prisma.event.findMany({
        where: {
          userId: user.id,
        },
        include: {
          eventParticipant: {
            include: {
              user: true,
              eventTicket: true,
              eventParticipantHistoric: true,
            },
          },
          eventTicket: true,
        },
      });

      let totalTickets = 0;
      let totalParticipants = 0;
      let total = 0;
      const participantsCheckIn = [];
      const participantsState = [];

      events.map((event) => {
        totalTickets += event.eventTicket.length;
        totalParticipants += event.eventParticipant.length;
        //alterar isso tbm
        event.eventParticipant.map((participant) => {
          participantsState.push({
            state: participant.user.state,
            // ticketValue: participant.eventTicket.price,
          });
          //total += Number(participant.eventTicket.price);
          participant.eventParticipantHistoric.map((historic) => {
            if (historic.status === 'CHECK_IN') {
              participantsCheckIn.push({
                id: historic.eventParticipantId,
                status: historic.status,
              });
            }
          });
        });
      });

      const stateSums: StateSumsFunc = participantsState.reduce(
        (acc: StateSumsFunc, item: DataItem) => {
          const state = item.state === null ? 'não definido' : item.state;
          if (acc[state]) {
            acc[state].count += 1;
            acc[state].ticketSum += Number(item.ticketValue);
          } else {
            acc[state] = {
              count: 1,
              ticketSum: Number(item.ticketValue),
            };
          }
          return acc;
        },
        {},
      );

      const { state: maxParticipantsState, count: maxParticipantsCount } =
        getMaxParticipantsState(stateSums);

      const percentage = (
        (maxParticipantsCount / participantsState.length) *
        100
      ).toFixed(2);

      const { state: maxSalesState, total: maxSalesTotal } =
        getMaxSalesState(stateSums);

      const bigParticipantsForState = {
        state: maxParticipantsState,
        total: percentage,
      };

      const bigSaleForState = {
        state: maxSalesState,
        total: maxSalesTotal,
      };

      const lastEvents = events
        .map((event) => {
          let total = 0;
          event.eventParticipant.forEach((participant) => {
            //ALTERAR ISSO
            // total += Number(participant.eventTicket.price);
          });

          if (total > 0) {
            return {
              id: event.id,
              title: event.title,
              slug: event.slug,
              total: total,
            };
          }
        })
        .filter((event) => event !== undefined) // Filtra os eventos que foram removidos (total <= 0)
        .slice(-10);

      const uniqueArray = Array.from(
        new Map(participantsCheckIn.map((item) => [item.id, item])).values(),
      );

      const response: GeneralDashboardResponseDto = {
        totalEvents: events.length,
        totalTickets,
        totalParticipants,
        total,
        participantsCheckIn: uniqueArray.length,
        participantsNotCheckedIn: totalParticipants - uniqueArray.length,
        lastEvents,
        bigParticipantsForState,
        bigSaleForState,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async findAllParticipants(
    email: string,
    slug: string,
    page: number,
    perPage: number,
    name?: string,
    ticketTitle?: [],
  ): Promise<ResponseEventParticipants> {
    try {
      const where: Prisma.EventParticipantWhereInput = {
        event: {
          slug: slug,
        },
      };

      if (name) {
        where.user = {
          name: {
            contains: name,
            mode: 'insensitive',
          },
        };
      }

      if (ticketTitle) {
        where.eventTicket = {
          title: {
            in: isArray(ticketTitle) ? ticketTitle : [ticketTitle],
          },
        };
      }

      await this.userProducerValidationService.eventExists(
        slug,
        email.toLowerCase(),
      );

      const eventParticipants = await this.prisma.eventParticipant.findMany({
        where,
        include: {
          user: {
            include: {
              userFacials: {
                orderBy: { createdAt: 'desc' },
              },
              userSocials: {
                where: {
                  username: { not: '' },
                },
              },
            },
          },
          eventParticipantHistoric: {
            orderBy: {
              createdAt: 'desc',
            },
          },
          eventTicket: true,
        },
        take: Number(perPage),
        skip: (page - 1) * Number(perPage),
      });

      const totalItems = await this.prisma.eventParticipant.count({ where });

      const pagination = await this.paginationService.paginate({
        page,
        perPage: perPage,
        totalItems,
      });

      const listParticipants = new Map<
        string,
        {
          participantId: string;
          name: string;
          ticketName: string;
          facial: string | null;
          checkInDate: Date;
          payment: boolean;
          email: string;
        }
      >();

      eventParticipants.forEach((participant) => {
        if (!listParticipants.has(participant.id)) {
          listParticipants.set(participant.id, {
            participantId: participant.id,
            name: participant.user.name,
            ticketName: participant.eventTicket.title,
            checkInDate: null,
            email: participant.user.email,
            facial:
              participant.user.userFacials.length > 0
                ? participant.user.userFacials[0].path
                : null,
            payment: participant.status !== 'AWAITING_PAYMENT' ? true : false,
          });
        }

        participant.eventParticipantHistoric.forEach((historic) => {
          if (historic.status === 'CHECK_IN') {
            if (listParticipants.has(historic.eventParticipantId)) {
              const existingParticipant = listParticipants.get(
                historic.eventParticipantId,
              );
              existingParticipant.checkInDate = historic.createdAt;
              listParticipants.set(
                historic.eventParticipantId,
                existingParticipant,
              );
            } else {
              listParticipants.set(historic.eventParticipantId, {
                participantId: participant.id,
                name: participant.user.name,
                ticketName: participant.eventTicket.title,
                checkInDate: null,
                email: participant.user.email,
                facial:
                  participant.user.userFacials.length > 0
                    ? participant.user.userFacials[0].path
                    : null,
                payment:
                  participant.status !== 'AWAITING_PAYMENT' ? true : false,
              });
            }
          }
        });
      });

      const eventParticipant = Array.from(listParticipants.values());

      const response: ResponseEventParticipants = {
        data: eventParticipant,
        pageInfo: pagination,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async financialDashboard(
    userEmail: string,
    eventSlug: string,
  ): Promise<EventDashboardPanelFinancialDto> {
    try {
      const event = await this.userProducerValidationService.eventExists(
        eventSlug,
        userEmail.toLowerCase(),
      );

      const balances = await this.prisma.balanceHistoric.findMany({
        where: {
          eventId: event.id,
        },
        include: {
          eventTicket: true,
        },
      });

      let total = 0;
      let totalReceived = 0;
      const balancesByDay = new Map<string, number>();
      const sellDiaryByTicket = new Map<
        string,
        Map<string, { ticket: string; date: string; total: number }>
      >();

      balances.map((balance) => {
        const value = Number(balance.value);
        if (value > 0) {
          total += value;

          const date = balance.createdAt.toISOString().split('T')[0];

          if (balancesByDay.has(date)) {
            balancesByDay.set(date, balancesByDay.get(date)! + value);
          } else {
            balancesByDay.set(date, value);
          }
        } else if (value < 0) {
          totalReceived += value;
        }
      });

      balances.forEach((balance) => {
        const value = Number(balance.value);
        if (value > 0 && balance.eventTicketId) {
          const date = balance.createdAt.toISOString().split('T')[0];
          if (!sellDiaryByTicket.has(balance.eventTicketId)) {
            sellDiaryByTicket.set(balance.eventTicketId, new Map());
          }

          const ticketBalances = sellDiaryByTicket.get(balance.eventTicketId)!;

          if (ticketBalances.has(date)) {
            ticketBalances.get(date)!.total += value;
          } else {
            ticketBalances.set(date, {
              ticket: balance.eventTicket.title,
              date: date,
              total: value,
            });
          }
        }
      });

      const sellDiaryByArray = Array.from(sellDiaryByTicket.values()).flatMap(
        (ticketBalances) => Array.from(ticketBalances.values()),
      );

      const sellDiary = Array.from(balancesByDay, ([date, total]) => ({
        date,
        total,
      }));

      const response: EventDashboardPanelFinancialDto = {
        eventTotal: total,
        eventTotalDrawee: totalReceived,
        totalDisponible: total + totalReceived,
        sellDiary: sellDiary,
        sellDiaryByTicket: sellDiaryByArray,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }
}

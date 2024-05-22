import {
  BadRequestException,
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
  GeneralDashboardResponseDto,
  ResponseEventParticipants,
  ResponseEvents,
} from './dto/event-producer-response.dto';
import {
  StorageService,
  StorageServiceType,
} from 'src/services/storage.service';
import { randomUUID } from 'crypto';
import { PaginationService } from 'src/services/paginate.service';
import { Prisma } from '@prisma/client';
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
        subtitle,
        title,
        eventTickets,
        eventPublic,
      } = body;

      if (startAt > endAt) {
        throw new BadRequestException(
          'O horário de início não pode ser maior que o horário de término',
        );
      }

      const slug = generateSlug(title);

      const user = await this.userProducerValidationService.eventNameExists(
        email,
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

      let cost = 0;

      const factor = eventConfig.printAutomatic
        ? 2
        : 0 +
          (eventConfig.credentialType === 'QRCODE'
            ? 1
            : eventConfig.credentialType === 'FACIAL_IN_SITE'
              ? 3
              : eventConfig.credentialType === 'FACIAL'
                ? 4
                : 0);

      if (factor > 0 || eventConfig.limit > 20) {
        cost = eventConfig.limit - 20 + eventConfig.limit * factor;
      }

      const createdEvent = await this.prisma.event.create({
        data: {
          userId: user.id,
          slug: slug,
          sequential: sequential + 1,
          title: title,
          category: category,
          subtitle: subtitle,
          location: location,
          public: eventPublic,
          type: cost > 0 ? 'PAID_OUT' : 'FREE',
          startAt: startAt,
          endAt: endAt,
          startPublishAt: startPublishAt,
          endPublishAt: endPublishAt,
          eventSchedule: {
            createMany: {
              data: eventScheduleFormatted,
            },
          },
          eventConfig: {
            create: {
              printAutomatic: eventConfig.printAutomatic,
              credentialType: eventConfig.credentialType,
              limit: eventConfig.limit,
            },
          },
          eventCost: {
            create: {
              limit: eventConfig.limit,
              status: false,
              cost: cost,
            },
          },
        },
        include: {
          eventCost: true,
        },
      });

      for (const ticket of eventTickets) {
        const body: EventTicketCreateDto = {
          title: ticket.title,
          color: ticket.color,
          description: ticket.description,
          price: ticket.price,
          links: ticket.links,
          guestPerLink: ticket.guestPerLink,
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
        eventCostid: createdEvent.eventCost[0].id,
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
          email,
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
        subtitle,
        title,
      } = body;

      await this.prisma.event.update({
        where: {
          id: event.id,
        },
        data: {
          category: category ? category : event.category,
          description: description ? description : event.description,
          endAt: endAt ? endAt : event.endAt,
          endPublishAt: endPublishAt ? endPublishAt : event.endPublishAt,
          location: location ? location : event.location,
          public: eventPublic ? eventPublic : event.public,
          startAt: startAt ? startAt : event.startAt,
          startPublishAt: startPublishAt
            ? startPublishAt
            : event.startPublishAt,
          subtitle: subtitle ? subtitle : event.subtitle,
          title: title ? title : event.title,
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
          email,
        );

      const event = await this.prisma.event.findUnique({
        where: {
          slug: slug,
          userId: user.id,
        },
        include: {
          eventTicket: {
            include: {
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
        },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const tickets = [];
      const totalTickets = event.eventTicket ? event.eventTicket.length : 0;
      let totalTicketsUsed = 0;
      let links = 0;
      const participantsCheckIn = [];
      const participantsState = [];
      const participants = [];
      const staffs = [];
      const hourCounts: { [key: string]: number } = {};

      event.EventStaff.map((staff) => {
        staffs.push({
          id: staff.id,
          email: staff.email,
        });
      });

      event.eventTicket.map((ticket) => {
        if (ticket.status === 'PART_FULL' || ticket.status === 'FULL') {
          totalTicketsUsed += 1;
        }
      });

      event.eventParticipant.map((participant) => {
        participantsState.push({
          state: participant.user.state,
        });

        participants.push({
          id: participant.id,
          name: participant.user.name,
          status:
            participant.eventParticipantHistoric.length > 0
              ? participant.eventParticipantHistoric[0].status
              : null,
          ticketName: participant.eventTicket.title,
          facial:
            participant.user.userFacials.length > 0
              ? participant.user.userFacials[0].path
              : null,
          email: participant.user.email,
          userNetwork:
            participant.user.userSocials.length > 0
              ? participant.user.userSocials[0].username
              : null,
        });

        participant.eventParticipantHistoric.map((historic) => {
          if (historic.status === 'CHECK_IN') {
            participantsCheckIn.push({
              id: historic.eventParticipantId,
              status: historic.status,
            });
          }

          const hour = new Date(historic.createdAt).getHours();
          const day = new Date(historic.createdAt).getDay();

          // Atualiza as contagens por hora
          if (hourCounts[`${day}-${hour}`]) {
            hourCounts[`${day}-${hour}`] += 1;
          } else {
            hourCounts[`${day}-${hour}`] = 1;
          }
        });
      });

      const hourlyCountsArray = Object.values(hourCounts);

      event.eventTicket.map((ticket) => {
        let linksUsed = 0;

        links += ticket.guest;

        ticket.eventTicketGuest.map((link) => {
          if (link.status === 'FULL') {
            linksUsed += 1;
          }
        });
        const enableLinks = ticket.eventTicketGuest.filter(
          (link) => link.status !== 'FULL',
        );
        tickets.push({
          id: ticket.id,
          title: ticket.title,
          price: ticket.price,
          linksUsed: `${ticket.eventTicketGuest.length - linksUsed}/${ticket.eventTicketGuest.length}`,
          guestPerLink:
            ticket.eventTicketGuest.length > 0
              ? ticket.eventTicketGuest[0].invite
              : 0,
          link: enableLinks.length > 0 ? enableLinks[0].id : null,
        });
      });

      const stateSums: StateSums = participantsState.reduce(
        (acc: StateSums, item: DataItem) => {
          const state = item.state === null ? 'não definido' : item.state;
          if (acc[state]) {
            acc[state].count += 1;
          } else {
            acc[state] = {
              count: 1,
            };
          }
          return acc;
        },
        {},
      );

      const sortedStates = Object.entries(stateSums).sort(
        (a, b) => b[1].count - a[1].count,
      );

      const topStatesCount = 4;
      const topStates = sortedStates.slice(0, topStatesCount);
      const otherStates = sortedStates.slice(topStatesCount);

      const topStatesResult: StateSums = {};
      topStates.forEach(([state, { count }]) => {
        topStatesResult[state] = { count };
      });

      const othersCount = otherStates.reduce(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (sum, [_, { count }]) => sum + count,
        0,
      );
      if (othersCount > 0) {
        topStatesResult['outros'] = { count: othersCount };
      }

      const uniqueArray = Array.from(
        new Map(participantsCheckIn.map((item) => [item.id, item])).values(),
      );

      const resultArray = Object.entries(topStatesResult).map(
        ([state, { count }]) => ({
          state,
          count,
        }),
      );

      let eventTerm = {
        id: null,
        termId: null,
        termName: null,
        signature: false,
        termPath: null,
      };

      if (event.eventTerm.length > 0) {
        eventTerm.id = event.eventTerm[0].id;
        eventTerm.termId = event.eventTerm[0].termId;
        eventTerm.signature = event.eventTerm[0].signature;
        eventTerm.termPath = event.eventTerm[0].term.path;
        eventTerm.termName = event.eventTerm[0].term.name;
      }

      const response: EventDashboardResponseDto = {
        id: event.id,
        title: event.title,
        slug: event.slug,
        photo: event.photo,
        category: event.category,
        description: event.description,
        endAt: event.endAt,
        endPublishAt: event.endPublishAt,
        eventPublic: event.public,
        location: event.location,
        startAt: event.startAt,
        haveTerm: event.eventTerm.length > 0 ? true : false,
        startPublishAt: event.startPublishAt,
        subtitle: event.subtitle,
        eventLimit: event.eventConfig[0].limit,
        eventPrintAutomatic: event.eventConfig[0].printAutomatic,
        eventCredentialType: event.eventConfig[0].credentialType,
        participants: participants,
        credential: {
          participantsCredentialPerHour: hourlyCountsArray,
          participantsCheckIn: uniqueArray.length,
          initialDate: event.startAt,
          finalDate: event.endAt,
        },
        links,
        tickets: tickets,
        ticketsCreated: totalTickets,
        ticketsUseds: totalTicketsUsed,
        alreadyCheckIn: uniqueArray.length,
        notCheckIn: event.eventParticipant.length - uniqueArray.length,
        statesInfo: resultArray,
        staffs,
        eventTerm,
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
    title?: string,
    category?: string,
    status?: string,
  ): Promise<ResponseEvents> {
    try {
      const user =
        await this.userProducerValidationService.validateUserProducerByEmail(
          email,
        );

      const where: Prisma.EventWhereInput = {
        userId: user.id,
      };

      if (title) {
        where.title = { contains: title, mode: 'insensitive' };
      }

      if (category) {
        where.category = { contains: category, mode: 'insensitive' };
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
          subtitle: event.subtitle,
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
    await this.userProducerValidationService.validateUserProducerByEmail(email);
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
        email,
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
      const user =
        await this.userProducerValidationService.findUserByEmail(email);

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

        event.eventParticipant.map((participant) => {
          participantsState.push({
            state: participant.user.state,
            ticketValue: participant.eventTicket.price,
          });
          total += Number(participant.eventTicket.price);
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
            total += Number(participant.eventTicket.price);
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

      await this.userProducerValidationService.eventExists(slug, email);

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

      const eventParticipant = eventParticipants.map((participant) => {
        return {
          id: participant.id,
          name: participant.user.name,
          status:
            participant.eventParticipantHistoric.length > 0
              ? participant.eventParticipantHistoric[0].status
              : null,
          ticketName: participant.eventTicket.title,
          facial:
            participant.user.userFacials.length > 0
              ? participant.user.userFacials[0].path
              : null,
          email: participant.user.email,
          userNetwork:
            participant.user.userSocials.length > 0
              ? participant.user.userSocials[0].username
              : 'Sem registro',
        };
      });

      const response: ResponseEventParticipants = {
        data: eventParticipant,
        pageInfo: pagination,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async paidEventCost(eventId: string, eventCostId: number): Promise<string> {
    try {
      await this.prisma.eventCost.update({
        where: {
          id: Number(eventCostId),
          eventId: eventId,
        },
        data: {
          status: true,
        },
      });
      return 'Payment successful';
    } catch (error) {
      throw error;
    }
  }

  async upgradeEvent(
    email: string,
    slug: string,
    body: EventProducerUpgradeDto,
  ) {
    try {
      const user =
        await this.userProducerValidationService.validateUserProducerByEmail(
          email,
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

      const eventConfig = await this.prisma.eventConfig.findUnique({
        where: {
          eventId: event.id,
        },
      });

      if (!eventConfig) {
        throw new NotFoundException('Event config not found');
      }

      const { credentialType, limit, printAutomatic } = body;

      const currentPrintFactor = eventConfig.printAutomatic ? 2 : 0;

      const currentCredentialFactor =
        eventConfig.credentialType === 'QRCODE'
          ? 1
          : eventConfig.credentialType === 'FACIAL_IN_SITE'
            ? 3
            : eventConfig.credentialType === 'FACIAL'
              ? 4
              : 0;

      const currentFactor = currentPrintFactor + currentCredentialFactor;

      const newPrintFactor = printAutomatic ? 2 : 0;
      const newCredentialFactor =
        credentialType === 'QRCODE'
          ? 1
          : credentialType === 'FACIAL_IN_SITE'
            ? 3
            : credentialType === 'FACIAL'
              ? 4
              : 0;

      const newFactor = newPrintFactor + newCredentialFactor;

      console.log('Current Factor', currentFactor);
      console.log('New Factor', newFactor);

      if (currentFactor > newFactor) {
        throw new ConflictException(
          'You cannot change the setting to a lower value',
        );
      }

      const newValue =
        newFactor - currentFactor == 0
          ? limit + limit * currentFactor
          : eventConfig.limit * (newFactor - currentFactor);

      const newParticipantsValue =
        limit > 0 && newFactor - currentFactor !== 0
          ? (newFactor + 1) * limit
          : 0;

      const newLimit = limit + eventConfig.limit;

      const total = newValue + newParticipantsValue;

      console.log('novo valor', total);

      await this.prisma.eventCost.create({
        data: {
          eventId: event.id,
          cost: Number(total) * -1,
          limit: limit,
          status: true,
        },
      });

      await this.prisma.balanceHistoric.create({
        data: {
          value: Number(total) * -1,
          description: `Alteração nas configurações do evento: ${event.title}`,
          userId: user.id,
          status: 'RECEIVED',
        },
      });

      const updatedEventConfig = await this.prisma.eventConfig.update({
        where: {
          eventId: event.id,
        },
        data: {
          credentialType: credentialType,
          limit: newLimit,
          printAutomatic: printAutomatic,
          event: {
            update: {
              type:
                printAutomatic || credentialType !== 'VOID' || newLimit > 20
                  ? 'PAID_OUT'
                  : 'FREE',
            },
          },
        },
      });

      return updatedEventConfig;
    } catch (error) {
      throw error;
    }
  }
}

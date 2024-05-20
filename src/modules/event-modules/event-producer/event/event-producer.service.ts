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
import { EventsResponse } from 'mailgun.js';
import { PaginationService } from 'src/services/paginate.service';
import { Prisma } from '@prisma/client';
import { EventTicketProducerService } from '../event-ticket/event-ticket-producer.service';
import { EventTicketCreateDto } from '../event-ticket/dto/event-ticket-producer-create.dto';

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
      } = body;

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
          },
          eventConfig: true,
          EventStaff: true,
        },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const tickets = [];
      let totalTickets = event.eventTicket ? event.eventTicket.length : 0;
      let totalTicketsUsed = 0;
      let links = 0;
      let participantsCheckIn = [];
      let participantsState = [];
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

          // Atualiza as contagens por hora
          if (hourCounts[hour]) {
            hourCounts[hour] += 1;
          } else {
            hourCounts[hour] = 1;
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

      const response: EventDashboardResponseDto = {
        id: event.id,
        title: event.title,
        photo: event.photo,
        eventLimit: event.eventConfig[0].limit,
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
      };

      return response;
    } catch (error) {
      console.log(error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  async findAllEvents(
    email: string,
    page: number,
    perPage: number,
    title?: string,
    category?: string,
  ): Promise<ResponseEvents> {
    try {
      console.log(page, perPage);
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
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ConflictException(error);
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
      console.log(error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(error);
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
      console.log(`Error uploading file document and term: ${error}`);
      throw new ConflictException(
        `Error uploading file document and term: ${error}`,
      );
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
      let participantsCheckIn = [];
      let participantsState = [];

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

      const stateSums: StateSums = participantsState.reduce(
        (acc: StateSums, item: DataItem) => {
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

      // Passo 2: Encontrar o estado com a maior quantidade de participantes
      let maxState: string | null = null;
      let maxCount = 0;

      for (const [state, { count }] of Object.entries(stateSums)) {
        if (count > maxCount) {
          maxCount = count;
          maxState = state;
        }
      }

      // Passo 3: Calcular a porcentagem de participantes daquele estado
      const percentage = ((maxCount / participantsState.length) * 100).toFixed(
        2,
      );

      // Passo 4: Calcular a soma dos valores dos ingressos de cada estado
      const ticketSums: { [key: string]: number } = {};
      for (const [state, { ticketSum }] of Object.entries(stateSums)) {
        ticketSums[state] = ticketSum;
      }

      const bigSaleForState = {
        state: '',
        total: 0,
      };

      if (maxState) {
        bigSaleForState.state = maxState;
        bigSaleForState.total = ticketSums[maxState];
      }

      const bigParticipantsForState = {
        state: maxState,
        total: percentage,
      };

      const lastEvents = events.slice(0, 10).map((event) => {
        let total = 0;
        event.eventParticipant.map((participant) => {
          total += Number(participant.eventTicket.price);
        });
        return {
          id: event.id,
          title: event.title,
          slug: event.slug,
          total: total,
        };
      });

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
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(error);
    }
  }

  async findAllParticipants(
    email: string,
    slug: string,
    page: number,
    perPage: number,
  ): Promise<ResponseEventParticipants> {
    try {
      const where: Prisma.EventParticipantWhereInput = {
        event: {
          slug: slug,
        },
      };

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
          status: participant.eventParticipantHistoric[0].status,
          ticketName: participant.eventTicket.title,
          facial: participant.user.userFacials[0].path,
          email: participant.user.email,
          userNetwork:
            participant.user.userSocials[0].username !== null
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
}

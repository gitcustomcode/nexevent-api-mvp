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

@Injectable()
export class EventProducerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userProducerValidationService: UserProducerValidationService,
    private readonly storageService: StorageService,
    private readonly paginationService: PaginationService,
  ) {}

  async createEvent(email: string, body: EventCreateDto): Promise<string> {
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
        ? 1
        : 0 +
          (eventConfig.credentialType === 'QRCODE'
            ? 1
            : eventConfig.credentialType === 'FACIAL_IN_SITE'
              ? 2
              : eventConfig.credentialType === 'FACIAL'
                ? 3
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
              status: true,
              cost: cost,
            },
          },
          eventTicket: {
            createMany: {
              data: eventTickets.map((ticket, index) => ({
                slug: generateSlug(ticket.title),
                sequential: index + 1,
                title: ticket.title,
                description: ticket.description,
                price: ticket.price,
                color: ticket.color,
                guest: ticket.guestPerLink * ticket.links,
              })),
            },
          },
        },
        include: {
          eventTicket: true,
        },
      });

      // console.log("Evento criado:", createdEvent);

      return `Evento criado com sucesso: ${slug}`;
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
          eventConfig: true,
        },
      });

      const participants = event.eventTicket.map((ticket) => {
        if (ticket) {
          ticket.EventParticipant.map((participant) => {
            return {
              id: participant.id,
              name: participant.user.name,
              status: participant.eventParticipantHistoric[0].status,
              ticketName: ticket.title,
            };
          });
        } else {
          return null;
        }
      });

      const tickets = event.eventTicket.map((ticket) => {
        return {
          id: ticket.id,
          name: ticket.title,
          status: ticket.status,
          guest: ticket.guest,
          participantsCount: ticket.EventParticipant.length,
        };
      });

      const response: EventDashboardResponseDto = {
        id: event.id,
        title: event.title,
        eventLimit: event.eventConfig[0].limit,
        credentialType: event.eventConfig[0].credentialType,
        eventParticipants: participants,
        eventParticipantsCount: participants.length,
        eventTickets: tickets,
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

  async findAllEvents(
    email: string,
    page: number,
    perPage: number,
    title?: string,
    category?: string,
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
      let participantsCheckIn = 0;

      events.map((event) => {
        totalTickets += event.eventTicket.length;
        totalParticipants += event.eventParticipant.length;

        event.eventParticipant.map((participant) => {
          total += Number(participant.eventTicket.price);
          participant.eventParticipantHistoric.map((historic) => {
            if (historic.status === 'CHECK_IN') {
              participantsCheckIn += 1;
            }
          });
        });
      });

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

      const response: GeneralDashboardResponseDto = {
        totalEvents: events.length,
        totalTickets,
        totalParticipants,
        total,
        participantsCheckIn,
        participantsNotCheckedIn: totalParticipants - participantsCheckIn,
        lastEvents,
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
}

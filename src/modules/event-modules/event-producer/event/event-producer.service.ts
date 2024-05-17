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
import { EventDashboardResponseDto } from './dto/event-producer-response.dto';
import {
  StorageService,
  StorageServiceType,
} from 'src/services/storage.service';
import { randomUUID } from 'crypto';

@Injectable()
export class EventProducerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userProducerValidationService: UserProducerValidationService,
    private readonly storageService: StorageService,
  ) {}

  async createEvent(email: string, body: EventCreateDto): Promise<String> {
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

      await this.prisma.event.create({
        data: {
          userId: user.id,
          slug,
          sequential: sequential + 1,
          title,
          category,
          subtitle,
          location,
          type: cost > 0 ? 'PAID_OUT' : 'FREE',
          startAt,
          endAt,
          startPublishAt,
          endPublishAt,
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
        },
      });

      return `Event successfully created: ${slug}`;
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
}

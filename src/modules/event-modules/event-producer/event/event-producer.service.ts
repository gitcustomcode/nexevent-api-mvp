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
import { EventAllResponseDto, EventDashboardResponseDto } from './dto/event-producer-response.dto';

@Injectable()
export class EventProducerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userProducerValidationService: UserProducerValidationService,
  ) { }

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

        const factor = eventConfig.printAutomatic ? 1 : 0 +
            (eventConfig.credentialType === 'QRCODE' ? 1 :
                eventConfig.credentialType === 'FACIAL_IN_SITE' ? 2 :
                    eventConfig.credentialType === 'FACIAL' ? 3 : 0);

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
                        data: eventScheduleFormatted
                    },
                },
                eventConfig: {
                    create: {
                        printAutomatic: eventConfig.printAutomatic,
                        credentialType: eventConfig.credentialType,
                        limit: eventConfig.limit
                    },
                },
                eventCost: {
                    create: {
                        limit: eventConfig.limit,
                        status: true,
                        cost: cost
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
                            guest: ticket.guestPerLink * ticket.links
                        })),
                    },
                },
            },
            include: {
                eventTicket: true
            },
        });

        // console.log("Evento criado:", createdEvent);

        return `Evento criado com sucesso: ${slug}`;
    } catch (error) {
        console.error("Erro ao criar evento:", error);
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
  ): Promise<EventAllResponseDto> {
    try {
      const user =
        await this.userProducerValidationService.validateUserProducerByEmail(
          email,
        );

      const event = await this.prisma.event.findMany({
        where: {
          userId: user.id,
        }
      });


      const events = event.map((event) => {
        return {
          id: event.id,
          title: event.title,
          slug: event.slug,
        };
      });


      return events;
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


}

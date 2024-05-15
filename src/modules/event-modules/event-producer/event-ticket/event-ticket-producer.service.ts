import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/services/prisma.service';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';
import { EventTicketCreateDto } from './dto/event-ticket-producer-create.dto';
import { generateSlug } from 'src/utils/generate-slug';
import { EventTicketUpdateDto } from './dto/event-ticket-producer-update.dto';
import { EventTicketsResponse } from './dto/event-ticket-producer-response.dto';
import { Prisma } from '@prisma/client';
import { PaginationService } from 'src/services/paginate.service';

@Injectable()
export class EventTicketProducerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userProducerValidationService: UserProducerValidationService,
    private readonly paginationService: PaginationService,
  ) {}

  async createEventTicket(
    userEmail: string,
    eventSlug: string,
    body: EventTicketCreateDto,
  ): Promise<String> {
    try {
      const { color, description, guestPerLink, links, price, title } = body;
      const slug = generateSlug(title);

      const { event, sequential } =
        await this.userProducerValidationService.validateUserEventTicket(
          userEmail,
          eventSlug,
          guestPerLink * links,
          slug,
        );

      const eventLinks = [];

      for (let i = 0; i < links; i++) {
        eventLinks.push({
          invite: guestPerLink,
        });
      }

      await this.prisma.eventTicket.create({
        data: {
          slug,
          sequential,
          eventId: event.id,
          title,
          description,
          price,
          color,
          guest: guestPerLink * links,
          eventTicketGuest: {
            createMany: {
              data: eventLinks,
            },
          },
        },
      });

      return 'Ticket created successfully';
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

  async updateEventTicket(
    userEmail: string,
    eventSlug: string,
    eventTicketId: string,
    body: EventTicketUpdateDto,
  ): Promise<String> {
    try {
      const { color, description, guests, price, title } = body;

      const slug = title ? generateSlug(title) : null;

      const { event } =
        await this.userProducerValidationService.validateUserEventTicket(
          userEmail,
          eventSlug,
          guests,
          slug !== null ? slug : null,
        );

      await this.prisma.eventTicket.update({
        where: {
          id: eventTicketId,
          eventId: event.id,
        },
        data: {
          slug,
          title,
          description,
          price,
          color,
          guest: guests,
        },
      });

      return 'Ticket updated successfully';
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

  async findAllEventTicket(
    userEmail: string,
    eventSlug: string,
    page: number,
    perPage: number,
  ): Promise<EventTicketsResponse> {
    try {
      const event = await this.userProducerValidationService.eventExists(
        eventSlug,
        userEmail,
      );

      const where: Prisma.EventTicketWhereInput = {
        eventId: event.id,
      };

      const tickets = await this.prisma.eventTicket.findMany({
        where,
        include: {
          EventParticipant: true,
          eventTicketGuest: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: Number(perPage),
        skip: (page - 1) * perPage,
      });

      const totalItems = await this.prisma.eventTicket.count({
        where,
      });

      const pagination = await this.paginationService.paginate({
        page,
        perPage,
        totalItems,
      });

      const response: EventTicketsResponse = {
        data: tickets.map((ticket) => {
          return {
            id: ticket.id,
            title: ticket.title,
            status: ticket.status,
            price: Number(ticket.price),
            guest: ticket.guest,
            participantsCount: ticket.EventParticipant.length,
            links: ticket.eventTicketGuest.map((link) => {
              return {
                id: link.id,
                status: link.status,
              };
            }),
          };
        }),

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
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(error);
    }
  }
}

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
import { StripeService } from 'src/services/stripe.service';

@Injectable()
export class EventTicketProducerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userProducerValidationService: UserProducerValidationService,
    private readonly paginationService: PaginationService,
    private readonly stripe: StripeService,
  ) {}

  async createEventTicket(
    userEmail: string,
    eventSlug: string,
    body: EventTicketCreateDto,
  ): Promise<string> {
    try {
      const {
        color,
        description,
        guestPerLink,
        links,
        price,
        title,
        passOnFee,
        startAt,
        endAt,
        ticketReferersTitle,
      } = body;
      const slug = generateSlug(title);

      const { event, sequential } =
        await this.userProducerValidationService.validateUserEventTicket(
          userEmail.toLowerCase(),
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
      let ticketReferersId = null;
      if (ticketReferersTitle) {
        const ticketReferers = await this.prisma.eventTicket.findFirst({
          where: {
            eventId: event.id,
            title: ticketReferersTitle,
          },
        });

        if (!ticketReferers) {
          throw new NotFoundException('Ticket referers not found');
        }

        ticketReferersId = ticketReferers.id;
      }

      let stripePriceId = null;

      const printAutomatic = event.eventConfig[0].printAutomatic ? 2 : 0;
      const credentialType = event.eventConfig[0].credentialType;
      const credential =
        credentialType === 'QRCODE'
          ? 1
          : credentialType === 'FACIAL'
            ? 4
            : credentialType === 'FACIAL_IN_SITE'
              ? 3
              : 0;

      let newPrice = passOnFee ? price + printAutomatic + credential : price;
      if (price > 0) {
        const stripePrice = await this.stripe.createProduct(title, newPrice);
        stripePriceId = stripePrice.id;
      }

      await this.prisma.eventTicket.create({
        data: {
          slug,
          sequential,
          eventId: event.id,
          title,
          description,
          eventTicketGuest: {
            createMany: {
              data: eventLinks,
            },
          },
        },
      });

      return 'Ticket created successfully';
    } catch (error) {
      throw error;
    }
  }

  async updateEventTicket(
    userEmail: string,
    eventSlug: string,
    eventTicketId: string,
    body: EventTicketUpdateDto,
  ): Promise<string> {
    try {
      const { color, description, guests, price, title } = body;

      const slug = title ? generateSlug(title) : null;

      const { event } =
        await this.userProducerValidationService.validateUserEventTicket(
          userEmail.toLowerCase(),
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
        },
      });

      return 'Ticket updated successfully';
    } catch (error) {
      throw error;
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
        userEmail.toLowerCase(),
      );

      const where: Prisma.EventTicketWhereInput = {
        eventId: event.id,
      };

      const tickets = await this.prisma.eventTicket.findMany({
        where,
        include: {
          EventParticipant: true,
          eventTicketGuest: {
            include: {
              eventParticipant: true,
            },
          },
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
            price: 10,
            guest: 10,
            participantsCount: ticket.EventParticipant.length,
            links: ticket.eventTicketGuest.map((link) => {
              return {
                id: link.id,
                status: link.status,
                limit: link.invite,
                used: link.eventParticipant.length,
                limitUsed: `${link.eventParticipant.length}/${link.invite}`,
              };
            }),
          };
        }),

        pageInfo: pagination,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }
}

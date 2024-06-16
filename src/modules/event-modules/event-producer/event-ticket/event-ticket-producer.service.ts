import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
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
import { randomUUID } from 'crypto';

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
        description,
        title,
        isFree,
        isPrivate,
        eventTicketPrices,
        eventTicketBonuses,
        eventTicketDays,
        isBonus,
      } = body;
      const slug = generateSlug(title);
      const ticketId = randomUUID();
      let ticketGuests = 0;

      if (isBonus && eventTicketPrices.length > 1) {
        throw new ConflictException(
          'Ingressos bonus não podem ter mais de 1 valor ou lote',
        );
      }

      const { event, sequential } =
        await this.userProducerValidationService.validateUserEventTicket(
          userEmail.toLowerCase(),
          eventSlug,
          slug,
        );

      const eventLinks: Prisma.EventTicketLinkCreateManyInput[] = [];
      const eventTicketPricesArr: Prisma.EventTicketPriceCreateManyInput[] = [];

      const newStartAt = new Date(event.startAt);
      const newEndAt = new Date(event.endAt);

      const eventTicketDayFormatted = eventTicketDays.map((day) => {
        if (day.date >= newStartAt && day.date <= newEndAt) {
          throw new ConflictException(
            'O ingresso possui um ou mais dias que não estão no periodo do evento',
          );
        }

        return {
          date: day.date,
        };
      });

      if (isFree === false) {
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

        await Promise.all(
          eventTicketPrices.map(async (ticketPrice, index) => {
            let bonusPrice = 0;
            if (eventTicketBonuses && eventTicketBonuses.length > 0) {
              eventTicketBonuses.map((b) => {
                bonusPrice += (printAutomatic + credential) * b.qtd;
              });
            }
            let newPrice = ticketPrice.passOnFee
              ? ticketPrice.price + printAutomatic + credential + bonusPrice
              : ticketPrice.price + bonusPrice;

            const currency = ticketPrice.currency;

            if (
              currency === 'brl' ||
              currency === 'usd' ||
              currency === 'eur'
            ) {
              if (ticketPrice.price > 0) {
                const newTitle = `${title} - Lote ${ticketPrice.batch} ${ticketPrice.isPromotion ? 'Promoção' : ''}`;

                const stripePrice = await this.stripe.createProduct(
                  newTitle,
                  newPrice,
                  currency.toUpperCase(),
                );

                const eventTicketPriceId = randomUUID();

                ticketGuests += ticketPrice.guests;

                eventTicketPricesArr.push({
                  id: eventTicketPriceId,
                  eventTicketId: ticketId,
                  batch: index + 1,
                  guests: ticketPrice.guests,
                  guestBonus: ticketPrice.guestBonus,
                  price: newPrice,
                  isPromotion: ticketPrice.isPromotion,
                  passOnFee: ticketPrice.passOnFee,
                  endPublishAt: ticketPrice.endPublishAt,
                  startPublishAt: ticketPrice.startPublishAt,
                  stripePriceId: stripePrice.id.toString(),
                });

                eventLinks.push({
                  eventTicketId: ticketId,
                  eventTicketPriceId: eventTicketPriceId,
                  invite: ticketPrice.guests,
                });
              }
            } else {
              throw new UnprocessableEntityException(`Currency not accepted`);
            }
          }),
        );
      } else {
        await Promise.all(
          eventTicketPrices.map(async (ticketPrice, index) => {
            const eventTicketPriceId = randomUUID();
            eventTicketPricesArr.push({
              id: eventTicketPriceId,
              eventTicketId: ticketId,
              batch: index + 1,
              guests: ticketPrice.guests,
              guestBonus: ticketPrice.guestBonus,
              price: ticketPrice.price,
              isPromotion: ticketPrice.isPromotion,
              passOnFee: ticketPrice.passOnFee,
              endPublishAt: ticketPrice.endPublishAt,
              startPublishAt: ticketPrice.startPublishAt,
              stripePriceId: null,
            });
            ticketGuests += ticketPrice.guests;
            eventLinks.push({
              eventTicketId: ticketId,
              eventTicketPriceId: eventTicketPriceId,
              invite: ticketPrice.guests,
            });
          }),
        );
      }

      const bonus = [];

      if (eventTicketBonuses && eventTicketBonuses.length > 0) {
        await Promise.all(
          eventTicketBonuses.map(async (ticketBonus) => {
            bonus.push({
              eventTicketBonusTitle: ticketBonus.ticketTitle,
              eventTicketId: ticketId,
              qtd: ticketBonus.qtd,
            });
          }),
        );
      }

      await this.prisma.eventTicket.create({
        data: {
          id: ticketId,
          slug,
          sequential,
          eventId: event.id,
          title,
          description,
          isPrivate,
          guests: ticketGuests,
          eventTicketDays: {
            createMany: {
              data: eventTicketDayFormatted,
            },
          },
        },
      });

      await this.prisma.eventTicketPrice.createMany({
        data: eventTicketPricesArr,
      });

      if (bonus.length > 0) {
        await this.prisma.eventTicketBonus.createMany({
          data: bonus,
        });
      }

      if (eventLinks.length > 0) {
        await this.prisma.eventTicketLink.createMany({
          data: eventLinks,
        });
      }

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

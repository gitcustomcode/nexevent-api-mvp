import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from 'src/services/prisma.service';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';
import {
  EventTicketCouponsDto,
  EventTicketCreateDto,
} from './dto/event-ticket-producer-create.dto';
import { generateSlug } from 'src/utils/generate-slug';
import { EventTicketUpdateDto } from './dto/event-ticket-producer-update.dto';
import {
  EventTicketCouponDashboardDto,
  EventTicketCouponsResponse,
  EventTicketsResponse,
} from './dto/event-ticket-producer-response.dto';
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

      if (!event.public) {
        body.isPrivate = true;
      }

      const eventLinks: Prisma.EventTicketLinkCreateManyInput[] = [];
      const eventTicketPricesArr: Prisma.EventTicketPriceCreateManyInput[] = [];

      const newStartAt = new Date(event.startAt);
      const newEndAt = new Date(event.endAt);

      const eventTicketDayFormatted = eventTicketDays.map((day) => {
        if (day.date < newStartAt && day.date > newEndAt) {
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
              let stripePriceId = null;
              if (ticketPrice.price > 0) {
                const newTitle = `${title} - Lote ${ticketPrice.batch} ${ticketPrice.isPromotion ? 'Promoção' : ''}`;

                const stripePrice = await this.stripe.createProduct(
                  newTitle,
                  newPrice,
                  currency.toUpperCase(),
                );

                stripePriceId = stripePrice.id;
              }

              const eventTicketPriceId = randomUUID();

              ticketGuests += ticketPrice.guests;

              eventTicketPricesArr.push({
                id: eventTicketPriceId,
                currency: currency.toUpperCase(),
                eventTicketId: ticketId,
                batch: index + 1,
                guests: ticketPrice.guests,
                guestBonus: ticketPrice.guestBonus,
                price: newPrice,
                isPromotion: ticketPrice.isPromotion,
                passOnFee: ticketPrice.passOnFee,
                endPublishAt: ticketPrice.endPublishAt
                  ? ticketPrice.endPublishAt
                  : new Date(),
                startPublishAt: ticketPrice.startPublishAt
                  ? ticketPrice.startPublishAt
                  : new Date(),
                stripePriceId: stripePriceId,
              });

              if (body.isPrivate) {
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
              currency: ticketPrice.currency.toUpperCase(),
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
            if (body.isPrivate) {
              eventLinks.push({
                eventTicketId: ticketId,
                eventTicketPriceId: eventTicketPriceId,
                invite: ticketPrice.guests,
              });
            }
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
          isPrivate: body.isPrivate,
          isBonus: isBonus,
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
    title?: string,
  ): Promise<EventTicketsResponse> {
    try {
      const event = await this.userProducerValidationService.eventExists(
        eventSlug,
        userEmail.toLowerCase(),
      );

      const where: Prisma.EventTicketWhereInput = {
        eventId: event.id,
      };

      if (title) {
        where.title = {
          contains: title,
          mode: 'insensitive',
        };
      }

      const tickets = await this.prisma.eventTicket.findMany({
        where,
        include: {
          eventTicketPrice: {
            include: {
              EventTicketLink: true,
              EventParticipant: true,
            },
          },
          EventParticipant: {
            include: {
              eventTicketPrice: true,
            },
          },
          eventTicketGuest: {
            include: {
              eventParticipant: true,
            },
          },
          event: {
            include: {
              eventConfig: true,
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

      const ticketsArr = [];

      await Promise.all(
        tickets.map(async (ticket) => {
          let limit = 0;
          let totalBrute = 0;
          const ticketBatch = [];

          ticket.eventTicketPrice.map((price) => {
            limit += price.guests;

            if (ticket.isPrivate) {
              ticketBatch.push({
                id: price.id,
                batch: price.batch,
                price: price.price,
                isPrivate: ticket.isPrivate,
                sells: price.EventParticipant.length,
                limit: price.guests,
                link: price.EventTicketLink,
                currency: price.currency,
              });
            } else {
              ticketBatch.push({
                id: price.id,
                batch: price.batch,
                price: price.price,
                isPrivate: ticket.isPrivate,
                sells: price.EventParticipant.length,
                limit: price.guests,
                currency: price.currency,
              });
            }
          });

          ticket.EventParticipant.map((participant) => {
            totalBrute += Number(participant.eventTicketPrice.price);
          });

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

          const tax =
            (printAutomatic + credential) * ticket.EventParticipant.length;

          ticketsArr.push({
            id: ticket.id,
            title: ticket.title,
            status: ticket.status,
            ticketLimit: limit,
            price: totalBrute,
            participantsCount: ticket.EventParticipant.length,
            priceLiquid: totalBrute - tax,
            isBonus: ticket.isBonus,
            ticketPercentualSell: Number(
              (ticket.EventParticipant.length / limit) * 100,
            ).toFixed(2),
            ticketBatch,
          });
        }),
      );

      const response: EventTicketsResponse = {
        data: ticketsArr,

        pageInfo: pagination,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async createEventTicketCoupons(
    userEmail: string,
    eventSlug: string,
    body: EventTicketCouponsDto,
  ) {
    try {
      const event = await this.userProducerValidationService.eventExists(
        eventSlug,
        userEmail.toLowerCase(),
      );

      const { code, eventTicketsId, expireAt, name, percentOff } = body;

      const stripePriceIds = [];

      await Promise.all(
        eventTicketsId.map(async (ticketId) => {
          const eventTicket = await this.prisma.eventTicket.findUnique({
            where: {
              id: ticketId.ticketId,
              eventId: event.id,
            },
            include: {
              eventTicketPrice: true,
            },
          });

          if (eventTicket.isBonus) {
            throw new ConflictException(
              `O ingresso ${eventTicket.title} é bônus`,
            );
          }

          eventTicket.eventTicketPrice.map((price) => {
            stripePriceIds.push(price.stripePriceId);
          });
        }),
      );

      const stripe = await this.stripe.createCupom(
        percentOff,
        stripePriceIds,
        code,
        expireAt,
      );

      const cupomCreated = await this.prisma.eventTicketCupom.create({
        data: {
          code: code,
          cupomStripeId: stripe.id,
          expireAt: expireAt,
          name: name,
          eventId: event.id,
          percentOff: percentOff,
        },
      });

      const data = [];

      await Promise.all(
        eventTicketsId.map((ticketId) => {
          data.push({
            eventTicketId: ticketId.ticketId,
            eventTicketCupomId: cupomCreated.id,
          });
        }),
      );

      await this.prisma.ticketCupom.createMany({
        data,
      });

      return 'CRIOU';
    } catch (error) {
      throw error;
    }
  }

  async findAllEventTicketCoupons(
    userEmail: string,
    eventSlug: string,
    page: number,
    perPage: number,
    title?: string,
  ): Promise<EventTicketCouponsResponse> {
    try {
      const event = await this.userProducerValidationService.eventExists(
        eventSlug,
        userEmail.toLowerCase(),
      );

      const where: Prisma.EventTicketCupomWhereInput = {
        eventId: event.id,
      };

      if (title) {
        where.name = {
          contains: title,
          mode: 'insensitive',
        };
      }

      const cupons = await this.prisma.eventTicketCupom.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: Number(perPage),
        skip: (page - 1) * perPage,
      });

      const totalItems = await this.prisma.eventTicketCupom.count({
        where,
      });

      const pagination = await this.paginationService.paginate({
        page,
        perPage,
        totalItems,
      });

      const cuponsArr = [];

      await Promise.all(
        cupons.map(async (cupom) => {
          const ticket = await this.prisma.eventTicket.findMany({
            where: {
              eventId: event.id,
              /* eventTicketCupom: {
                every: {
                  id: cupom.id,
                },
              }, */
            },
          });

          const ticketsArr = [];

          ticket.map((t) => {
            ticketsArr.push({
              id: t.id,
              title: t.title,
            });
          });

          cuponsArr.push({
            id: cupom.id,
            title: cupom.name,
            code: cupom.code,
            percentOff: cupom.percentOff,
            createdAt: cupom.createdAt,
            expireAt: cupom.expireAt,

            tickets: ticketsArr,
          });
        }),
      );

      const response: EventTicketCouponsResponse = {
        data: cuponsArr,
        pageInfo: pagination,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async cuponsDashboard(
    userEmail: string,
    eventSlug: string,
  ): Promise<EventTicketCouponDashboardDto> {
    try {
      const event = await this.userProducerValidationService.eventExists(
        eventSlug,
        userEmail.toLowerCase(),
      );

      const cupons = await this.prisma.eventTicketCupom.findMany({
        where: {
          eventId: event.id,
        },
      });

      let cuponsExpired = 0;
      const today = new Date();

      cupons.forEach((cupom) => {
        if (today > cupom.expireAt) {
          cuponsExpired++;
        }
      });

      const response: EventTicketCouponDashboardDto = {
        cuponsCreated: cupons.length,
        cuponsActives: cupons.length - cuponsExpired,
        cuponsExpired: cuponsExpired,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }
}

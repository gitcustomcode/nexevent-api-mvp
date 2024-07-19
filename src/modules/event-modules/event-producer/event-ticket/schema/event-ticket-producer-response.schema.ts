import { EventTicketLinkStatus, EventTicketStatus } from '@prisma/client';import { z } from 'nestjs-zod/z';

export const EventTicketDashboardResponseSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    status: z.nativeEnum(EventTicketStatus),
    price: z.number(),
    priceLiquid: z.number(),
    participantsCount: z.number(),
    ticketLimit: z.number(),
    ticketPercentualSell: z.number(),
    isBonus: z.boolean(),

    ticketBatch: z.array(
      z.object({
        id: z.string(),
        batch: z.number(),
        price: z.number(),
        sells: z.number(),
        limit: z.number(),
        currency: z.string(),
        isPrivate: z.boolean(),
        link: z.array(
          z.object({
            id: z.string(),
            eventTicketId: z.string(),
            eventTicketPriceId: z.string(),
            userId: z.string(),
            userTicketId: z.string(),
            isBonus: z.boolean(),
            invite: z.number(),
            status: z.nativeEnum(EventTicketLinkStatus),
            createdAt: z.date(),
            updatedAt: z.date(),
          }),
        ),
      }),
    ),
  }),
);

export const EventTicketCouponResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  code: z.string(),
  percentOff: z.number(),
  createdAt: z.date(),
  expireAt: z.date(),

  tickets: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
    }),
  ),
});

export const EventTicketCouponDashboardSchema = z.object({
  cuponsCreated: z.number(),
  cuponsActives: z.number(),
  cuponsExpired: z.number(),
});

export const EventTicketLinkResponseSchema = z.array(
  z.object({
    id: z.string(),
    eventTicketId: z.string(),
    invite: z.number(),
    status: z.nativeEnum(EventTicketLinkStatus),
    createdAt: z.date(),
    updatedAt: z.date(),

    participant: z.array(
      z.object({
        partId: z.string(),
        userName: z.string(),
        userEmail: z.string(),
        createdAt: z.date(),
      }),
    ),
  }),
);

export const EventTicketLinkByEmailSchema = z.object({ 
  users: z.array(
    z.object({
      name: z.string(),
      email: z.string(),
    })
  ),
  uncompleted: z.array(
    z.object({
      line: z.number(),
      reason: z.string(),
    })
  ),
})

import { EventTicketLinkStatus, EventTicketStatus } from '@prisma/client';import { z } from 'nestjs-zod/z';

export const EventTicketDashboardResponseSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    status: z.nativeEnum(EventTicketStatus),
    price: z.number(),
    priceLiquid: z.number(),
    guest: z.number(),
    participantsCount: z.number(),
    ticketLimit: z.number(),
    ticketPercentualSell: z.number(),

    ticketBatch: z.array(
      z.object({
        id: z.string(),
        batch: z.number(),
        price: z.number(),
        sells: z.number(),
        limit: z.number(),
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

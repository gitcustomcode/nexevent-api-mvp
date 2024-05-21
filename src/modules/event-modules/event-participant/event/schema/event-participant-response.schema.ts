import { z } from 'nestjs-zod/z';

export const ParticipantTicketSchema = z.object({
  id: z.string(),
  ticketName: z.string(),
  price: z.number(),
  eventName: z.string(),
  qrcode: z.string(),
  startAt: z.date(),
});

export const FindEventInfoSchema = z.object({
  id: z.string(),
  title: z.string(),
  startAt: z.date(),
  haveDocument: z.boolean(),
});

export const FindAllPublicEventsSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    photo: z.string(),
    category: z.string(),
    description: z.string(),
    startAt: z.date(),
    endAt: z.date(),
  }),
);

export const FindOnePublicEventsSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  photo: z.string(),
  category: z.string(),
  description: z.string(),
  startAt: z.date(),
  endAt: z.date(),
  ticket: z.array(
    z.object({
      id: z.string(),
      ticketName: z.string(),
      price: z.number(),
    }),
  ),
});

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

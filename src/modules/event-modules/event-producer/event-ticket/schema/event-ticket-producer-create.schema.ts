import { date, z } from 'nestjs-zod/z';
function parseDate(value: string): Date {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date string');
  }
  return date;
}

export const EventTicketPriceCreateSchema = z.object({
  isPromotion: z.boolean(),
  batch: z.number(),
  guests: z.number(),
  guestBonus: z.number(),
  price: z.number(),
  passOnFee: z.boolean(),
  startPublishAt: z.string().transform(parseDate).nullish(),
  endPublishAt: z.string().transform(parseDate).nullish(),
  currency: z.string().toLowerCase(),
});

export const EventTicketDaysSchema = z.object({
  date: z.string().transform(parseDate),
});

export const EventTicketBonusesSchema = z.object({
  ticketTitle: z.string(),
  qtd: z.number(),
});

export const EventTicketCouponsSchema = z.object({
  code: z.string(),
  name: z.string(),
  expireAt: z.string().transform(parseDate),
  eventTicketsId: z.array(
    z.object({
      ticketId: z.string(),
    }),
  ),
  percentOff: z.number(),
});

export const EventTicketCreateSchema = z.object({
  title: z.string().describe('Ticket title'),
  description: z.string().describe('Ticket description'),
  isFree: z.boolean(),
  isPrivate: z.boolean(),
  isBonus: z.boolean(),
  eventTicketPrices: z.array(EventTicketPriceCreateSchema),
  eventTicketDays: z.array(EventTicketDaysSchema),
  eventTicketBonuses: z.array(EventTicketBonusesSchema).optional(),
});

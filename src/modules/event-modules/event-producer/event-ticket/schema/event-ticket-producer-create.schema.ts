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
  batch: z.number().positive().int(),
  guests: z.number().positive().int(),
  guestBonus: z.number().int(),
  price: z.number().positive(),
  passOnFee: z.boolean(),
  startPublishAt: z.string().transform(parseDate),
  endPublishAt: z.string().transform(parseDate),
  currency: z.string().toLowerCase(),
});

export const EventTicketCreateSchema = z.object({
  title: z.string().describe('Ticket title'),
  description: z.string().describe('Ticket description'),
  isFree: z.boolean(),
  isPrivate: z.boolean(),
  eventTicketPrices: z.array(EventTicketPriceCreateSchema),
});

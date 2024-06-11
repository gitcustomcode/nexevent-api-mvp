import { date, z } from 'nestjs-zod/z';

function parseDate(value: string): Date {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date string');
  }
  return date;
}

export const EventTicketCreateSchema = z.object({
  title: z.string().describe('Ticket title'),
  description: z.string().describe('Ticket description'),
  price: z.number().describe('Ticket price'),
  color: z.string().describe('Ticket color'),
  links: z.number().describe('Ticket links generate'),
  guestPerLink: z.number().describe('Ticket link guest per link'),
  startAt: z.string().transform(parseDate).describe('Ticket start selling'),
  endAt: z.string().transform(parseDate).describe('Ticket end selling'),
  ticketReferersTitle: z.string().nullish(),
  passOnFee: z.boolean(),
});

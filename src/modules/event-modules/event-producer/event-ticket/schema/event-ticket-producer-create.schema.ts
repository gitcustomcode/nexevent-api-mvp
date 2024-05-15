import { z } from 'nestjs-zod/z';

export const EventTicketCreateSchema = z.object({
  title: z.string().describe('Ticket title'),
  description: z.string().describe('Ticket description'),
  price: z.number().describe('Ticket price'),
  color: z.string().describe('Ticket color'),
  links: z.number().describe('Ticket links generate'),
  guestPerLink: z.number().describe('Ticket link guest per link'),
});

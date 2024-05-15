import { z } from 'nestjs-zod/z';

export const EventTicketUpdateSchema = z.object({
  title: z.string().optional().describe('Ticket title'),
  description: z.string().optional().describe('Ticket description'),
  price: z.number().optional().describe('Ticket price'),
  color: z.string().optional().describe('Ticket color'),
  guests: z.number().optional().describe('Ticket guests limit'),
});

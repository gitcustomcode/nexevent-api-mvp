import { CredentialType } from '@prisma/client';
import { z } from 'nestjs-zod/z';

function parseDate(value: string): Date {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date string');
  }
  return date;
}

export const EventCreateSchema = z.object({
  title: z.string().describe('Event name'),
  subtitle: z.string().describe('Event subtitle'),
  startAt: z
    .string()
    .transform(parseDate)
    .default(new Date().toDateString())
    .describe('Event start date'),
  endAt: z
    .string()
    .transform(parseDate)
    .default(new Date().toDateString())
    .describe('Event end date'),
  startPublishAt: z
    .string()
    .transform(parseDate)
    .default(new Date().toDateString())
    .describe('Event publish start date'),
  endPublishAt: z
    .string()
    .transform(parseDate)
    .default(new Date().toDateString())
    .describe('Event publish end date'),
  category: z.string().describe('Event category'),
  location: z.string().describe('Event location'),
  eventSchedule: z.array(
    z.object({
      date: z.string().describe('Event schedule day'),
      startHour: z.string().describe('Event schedule start hour'),
      endHour: z.string().describe('Event schedule end hour'),
      description: z.string().describe('Event schedule description'),
    }),
  ),
  eventConfig: z.object({
    printAutomatic: z.boolean(),
    credentialType: z.nativeEnum(CredentialType),
    limit: z.number(),
  }),
  eventTickets: z.array(
    z.object({
      title: z.string().describe('Ticket title'),
      description: z.string().describe('Ticket description'),
      price: z.number().describe('Ticket price'),
      color: z.string().describe('Ticket color'),
      links: z.number().describe('Ticket links generate'),
      guestPerLink: z.number().describe('Ticket link guest per link'),
    })
  ),
});

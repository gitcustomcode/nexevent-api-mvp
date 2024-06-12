import { CredentialType, EventLocation } from '@prisma/client';
import { z } from 'nestjs-zod/z';
import { EventTicketCreateSchema } from '../../event-ticket/schema/event-ticket-producer-create.schema';

function parseDate(value: string): Date {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date string');
  }
  return date;
}

export const EventCreateSchema = z.object({
  title: z.string().describe('Event name'),
  description: z.string().describe('Event description'),
  eventPublic: z.boolean().default(true).describe('Event public'),
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
  location: z.nativeEnum(EventLocation).describe('Event location type'),
  latitude: z.string().nullish(),
  longitude: z.string().nullish(),
  sellOnThePlatform: z.boolean(),
  taxToClient: z.boolean(),

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
  }),

  eventTickets: z.array(EventTicketCreateSchema),
});

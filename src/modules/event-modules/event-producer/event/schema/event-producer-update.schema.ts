import { CredentialType, EventLocation } from '@prisma/client';
import { z } from 'nestjs-zod/z';

function parseDate(value: string): Date {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date string');
  }
  return date;
}

export const EventProducerUpdate = z.object({
  title: z.string().nullish(),
  category: z.string().nullish(),
  description: z.string().nullish(),
  location: z.nativeEnum(EventLocation).nullish(),
  latitude: z.string().nullish(),
  longitude: z.string().nullish(),
  eventPublic: z.boolean().nullish(),
  startAt: z
    .string()
    .transform(parseDate)
    .default(new Date().toDateString())
    .nullish(),
  endAt: z
    .string()
    .transform(parseDate)
    .default(new Date().toDateString())
    .nullish(),
  startPublishAt: z
    .string()
    .transform(parseDate)
    .default(new Date().toDateString())
    .nullish(),
  endPublishAt: z
    .string()
    .transform(parseDate)
    .default(new Date().toDateString())
    .nullish(),
});

export const EventProducerUpgradeSchema = z.object({
  printAutomatic: z.boolean(),
  credentialType: z.nativeEnum(CredentialType),
  limit: z.number(),
});

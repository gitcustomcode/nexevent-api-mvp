import { CredentialType, EventLocation } from '@prisma/client';import { z } from 'nestjs-zod/z';

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
  address: z.string().nullish(),
  country: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  complement: z.string().nullish(),
  number: z.string().nullish(),
  district: z.string().nullish(),
});

export const EventProducerUpgradeSchema = z.object({
  printAutomatic: z.boolean(),
  credentialType: z.nativeEnum(CredentialType),
  limit: z.number(),
});

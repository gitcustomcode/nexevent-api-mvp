import { UserNetworkType } from '@prisma/client';import { z } from 'nestjs-zod/z';

export const EventParticipantCreateNetworksSchema = z.array(
  z.object({
    network: z.nativeEnum(UserNetworkType).describe('User network type'),
    username: z.string().describe('User network name'),
  }),
);

export const EventParticipantCreateSchema = z.object({
  name: z.string().describe('Event participant name'),
  document: z.string().nullish().describe('Event participant document'),
  phoneCountry: z
    .string()
    .nullish()
    .describe('Event participant phone country'),
  phoneNumber: z.string().nullish().describe('Event participant phone number'),
  state: z.string().nullish().describe('Event participant state'),
  city: z.string().nullish().describe('Event participant state'),
  country: z.string().nullish().describe('Event participant country'),
  networks: EventParticipantCreateNetworksSchema.optional(),
});

export const EventTicketSellSchema = z.object({
  eventSlug: z.string(),
  eventTickets: z.array(
    z.object({
      ticketPriceId: z.string(),
      ticketQuantity: z.number(),
      participant: z.string().nullish(),
    }),
  ),

  user: z
    .object({
      name: z.string(),
      email: z.string(),
      phone: z.string(),
      document: z.string(),
      state: z.string(),
      city: z.string(),
    })
    .optional(),

  networks: EventParticipantCreateNetworksSchema.optional(),
});


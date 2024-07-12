import { UserType } from '@prisma/client';import { z } from 'nestjs-zod/z';

export const UserValidationEmailResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullish(),
  document: z.string().nullish(),
  profilePhoto: z.string().nullish(),
  phoneCountry: z.string().nullish(),
  phoneNumber: z.string().nullish(),
  street: z.string().nullish(),
  district: z.string().nullish(),
  state: z.string().nullish(),
  city: z.string().nullish(),
  country: z.string().nullish(),
  number: z.string().nullish(),
  complement: z.string().nullish(),
  cep: z.string().nullish(),
  type: z.nativeEnum(UserType),
  dateBirth: z.string().nullish(),
  validAt: z.date().nullish(),
  exp: z.date().nullish(),
  createdAt: z.date(),
});

export const ValidateUserEventTicket = z.object({});

export const UserEventParticipantCreateSchema = z.object({
  name: z.string().describe('Event participant name'),
  dateBirth: z.string().describe('Event participant date birth'),
  document: z.string().nullish().describe('Event participant document'),
  phoneCountry: z
    .string()
    .nullish()
    .describe('Event participant phone country'),
  phoneNumber: z.string().nullish().describe('Event participant phone number'),
  state: z.string().nullish().describe('Event participant state'),
  country: z.string().nullish().describe('Event participant country'),
  city: z.string().nullish(),
  cep: z.string().nullish().describe('Event participant cep'),
});

import { z } from 'nestjs-zod/z';

export const EventParticipantCreateSchema = z.object({
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
  cep: z.string().nullish().describe('Event participant cep'),
});

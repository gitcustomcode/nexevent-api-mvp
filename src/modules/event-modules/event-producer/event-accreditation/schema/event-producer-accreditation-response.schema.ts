import { CredentialType, EventParticipantHistoricStatus } from '@prisma/client';
import { z } from 'nestjs-zod/z';

export const LastAccreditedParticipantsSchema = z.array(
  z.object({
    id: z.number(),
    userName: z.string(),
    status: z.nativeEnum(EventParticipantHistoricStatus),
    createdAt: z.date(),
  }),
);

export const GetEventConfigSchema = z.object({
  id: z.number(),
  printAutomatic: z.boolean(),
  credentialType: z.nativeEnum(CredentialType),
});

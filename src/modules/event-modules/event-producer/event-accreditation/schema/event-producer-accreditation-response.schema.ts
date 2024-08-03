import { CredentialType, EventParticipantHistoricStatus } from '@prisma/client';
import { z } from 'nestjs-zod/z';

export const LastAccreditedParticipantsSchema = z.array(
  z.object({
    id: z.number(),
    ticketName: z.string(),
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

export const FindByQrCodeResponseSchema = z.object({
  id: z.string(),
  userName: z.string(),
  userDocument: z.string(),
});

export const FindByFacialResponseSchema = z.object({
  userName: z.string(),

  tickets: z.array(
    z.object({
      id: z.string(),
      qrcode: z.string(),
      ticketName: z.string(),
      lastStatus: z.string(),
    }),
  ),
});

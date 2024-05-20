import { EventParticipantHistoricStatus } from '@prisma/client';
import { z } from 'nestjs-zod/z';

export const LastAccreditedParticipantsSchema = z.array(
  z.object({
    id: z.number(),
    userName: z.string(),
    status: z.nativeEnum(EventParticipantHistoricStatus),
    createdAt: z.date(),
  }),
);

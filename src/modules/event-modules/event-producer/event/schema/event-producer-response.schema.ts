import {
  CredentialType,
  EventParticipantHistoricStatus,
  EventTicketStatus,
} from '@prisma/client';
import { z } from 'nestjs-zod/z';

export const EventDashboardResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  eventLimit: z.number(),
  credentialType: z.nativeEnum(CredentialType),
  eventParticipants: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      status: z.nativeEnum(EventParticipantHistoricStatus),
      ticketName: z.string(),
    }),
  ),
  eventParticipantsCount: z.number(),
  eventTickets: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      status: z.nativeEnum(EventTicketStatus),
      guest: z.number(),
      participantsCount: z.number(),
    }),
  ),
});

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

export const EventAllResponseSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
  }),
);

export const GeneralDashboardResponseSchema = z.object({
  totalEvents: z.number(),
  totalTickets: z.number(),
  totalParticipants: z.number(),
  total: z.number(),

  lastEvents: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      slug: z.string(),
      total: z.number(),
    }),
  ),

  bigParticipantsForState: z.object({
    state: z.string(),
    total: z.string(),
  }),

  bigSaleForState: z.object({
    state: z.string(),
    total: z.number(),
  }),

  participantsCheckIn: z.number(),
  participantsNotCheckedIn: z.number(),
});

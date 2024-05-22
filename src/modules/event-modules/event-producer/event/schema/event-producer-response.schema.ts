import {
  CredentialType,
  EventParticipantHistoricStatus,
  EventTicketStatus,
} from '@prisma/client';
import { z } from 'nestjs-zod/z';

export const EventDashboardResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  category: z.string(),
  subtitle: z.string(),
  description: z.string(),
  location: z.string(),
  eventPublic: z.boolean(),
  startAt: z.date(),
  endAt: z.date(),
  startPublishAt: z.date(),
  endPublishAt: z.date(),
  photo: z.string(),
  haveTerm: z.boolean(),
  eventLimit: z.number(),
  eventPrintAutomatic: z.boolean(),
  eventCredentialType: z.nativeEnum(CredentialType),
  participants: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      status: z.nativeEnum(EventParticipantHistoricStatus),
      ticketName: z.string(),
      facial: z.string(),
      email: z.string(),
      userNetwork: z.string(),
    }),
  ),
  credential: z.object({
    participantsCredentialPerHour: z.array(z.number()),
    participantsCheckIn: z.number(),
    initialDate: z.date(),
    finalDate: z.date(),
  }),
  tickets: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      price: z.number(),
      linksUsed: z.string(),
      guestPerLink: z.number(),
      link: z.string(),
    }),
  ),
  links: z.number(),
  ticketsCreated: z.number(),
  ticketsUseds: z.number(),
  alreadyCheckIn: z.number(),
  notCheckIn: z.number(),
  statesInfo: z.array(
    z.object({
      state: z.string(),
      total: z.number(),
    }),
  ),
  staffs: z.array(
    z.object({
      id: z.string(),
      email: z.string(),
    }),
  ),
  eventTerm: z.object({
    id: z.number(),
    termId: z.string(),
    termName: z.string(),
    termPath: z.string(),
    signature: z.boolean(),
  }),
});

export const EventAllResponseSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    subtitle: z.string(),
    slug: z.string(),
    photo: z.string(),
    startAt: z.date(),
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

export const EventParticipantsResponseSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    status: z.nativeEnum(EventParticipantHistoricStatus),
    ticketName: z.string(),
    facial: z.string(),
    email: z.string(),
    userNetwork: z.string(),
  }),
);

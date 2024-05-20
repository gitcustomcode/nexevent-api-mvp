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
  photo: z.string(),
  eventLimit: z.number(),
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
});

export const EventAllResponseSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
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

import {  CredentialType,
  EventParticipantHistoricStatus,
  EventStatus,
  EventTicketStatus,
} from '@prisma/client';
import { z } from 'nestjs-zod/z';

export const EventDashboardResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  status: z.nativeEnum(EventStatus),
  eventStaff: z.number(),
  eventViews: z.number(),

  eventParticipantsCount: z.number(),
  eventParticipantLimitCount: z.number(),
  eventParcitipantAccreditationsCount: z.number(),
  eventParcitipantAccreditationsPercentual: z.number(),

  eventTotal: z.number(),
  eventTickets: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      price: z.number(),
    }),
  ),

  eventTicketPercentualSell: z.array(
    z.object({
      title: z.string(),
      percentual: z.number(),
    }),
  ),

  eventDiarySells: z.array(
    z.object({
      date: z.string(),
      total: z.number(),
    }),
  ),
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

export const FindOneDashboardParticipantPanelSchema = z.object({
  eventLimit: z.number(),
  eventParticipantsCount: z.number(),
  eventParticipantAwaitPayment: z.number(),

  listParticipants: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      ticketName: z.string(),
      checkInDate: z.date().nullable(),
      payment: z.boolean(),
    }),
  ),

  eventParcitipantAccreditationsCount: z.number(),
  eventParcitipantAccreditationsPercentual: z.number(),
  eventParticipantAccreditationsPerMinute: z.number(),

  eventAverageLocation: z.array(
    z.object({
      region: z.string(),
      percentage: z.number(),
    }),
  ),
});

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
  eventCity: z.string(),
  eventState: z.string(),
  startAt: z.date(),

  eventParticipantsCount: z.number(),
  eventParticipantLimitCount: z.number(),
  eventParcitipantAccreditationsCount: z.number(),
  eventParcitipantAccreditationsPercentual: z.number(),

  currency: z.string(),

  eventTotal: z.number(),
  eventTickets: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      price: z.number(),
      partQtd: z.number(),
      limit: z.number(),
    }),
  ),

  eventTicketPercentualSell: z.array(
    z.object({
      title: z.string(),
      percentual: z.number(),
    }),
  ),

  sellDiary: z.array(
    z.object({
      date: z.string(),
      total: z.number(),
    }),
  ),
});

export const getEventsPrintAutomaticSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    photo: z.string(),
    slug: z.string(),
  }),
);

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

  totalBrute: z.number(),
  totalLiquid: z.number(),
  totalDrawee: z.number(),

  bestEvents: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      total: z.number(),
    }),
  ),

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
    checkInDate: z.date().nullable(),
    payment: z.boolean(),
    lastStatus: z.string(),
  }),
);

export const FindOneDashboardParticipantPanelSchema = z.object({
  eventLimit: z.number(),
  eventParticipantsCount: z.number(),
  eventParticipantAwaitPayment: z.number(),
  eventEndDate: z.date(),

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

export const EventDashboardPanelFinancialSchema = z.object({
  eventTotal: z.number(),
  eventTotalDrawee: z.number(),
  totalDisponible: z.number(),
  currency: z.string(),

  sellDiary: z.array(
    z.object({
      date: z.string(),
      total: z.number(),
    }),
  ),

  sellDiaryByTicket: z.array(
    z.object({
      ticket: z.string(),
      total: z.number(),
      date: z.string(),
    }),
  ),
});

export const EventPrintPartSchema = z.object({
  partId: z.string(),
  name: z.string(),
  ticket: z.string(),
  qrcode: z.string(),
});

export const EventPrintAllPartsSchema = z.array(EventPrintPartSchema);

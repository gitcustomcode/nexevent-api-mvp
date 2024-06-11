import { CredentialType, EventLocation } from '@prisma/client';
import { z } from 'nestjs-zod/z';

export const ParticipantTicketSchema = z.object({
  id: z.string(),
  ticketName: z.string(),
  price: z.number(),
  eventName: z.string(),
  qrcode: z.string(),
  startAt: z.date(),
});

export const FindEventInfoSchema = z.object({
  id: z.string(),
  title: z.string(),
  startAt: z.date(),
  haveDocument: z.boolean(),
});

export const FindAllPublicEventsSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    photo: z.string(),
    category: z.string(),
    description: z.string(),
    startAt: z.date(),
    endAt: z.date(),
  }),
);

export const FindOnePublicEventsSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  photo: z.string(),
  category: z.string(),
  description: z.string(),
  startAt: z.date(),
  endAt: z.date(),
  location: z.nativeEnum(EventLocation),
  latitude: z.string(),
  longitude: z.string(),
  ticket: z.array(
    z.object({
      id: z.string(),
      ticketName: z.string(),
      description: z.string(),
      price: z.number(),
    }),
  ),
  config: z.object({
    credentialType: z.nativeEnum(CredentialType),
    participantNetworks: z.boolean(),
  }),
});

export const ListTicketsSchema = z.array(
  z.object({
    eventSlug: z.string(),
    eventPhoto: z.string(),
    eventTitle: z.string(),
    eventDescription: z.string(),
    eventStartAt: z.date(),
  }),
);

export const EventTicketInfoSchema = z.object({
  eventParticipantId: z.string(),
  eventPhoto: z.string(),
  eventDescription: z.string(),
  eventTitle: z.string(),
  eventParticipantQrcode: z.string(),
  eventTicketTitle: z.string(),
  eventStartAt: z.date(),
});

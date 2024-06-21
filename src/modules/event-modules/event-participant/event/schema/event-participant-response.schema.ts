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
    state: z.string(),
    city: z.string(),
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
  state: z.string(),
  city: z.string(),
  address: z.string(),
  complement: z.string(),
  country: z.string(),
  number: z.string(),
  district: z.string(),
  ticket: z.array(
    z.object({
      id: z.string(),
      batch: z.number(),
      avaible: z.number(),
      ticketName: z.string(),
      description: z.string(),
      price: z.number(),
      currency: z.string(),
    }),
  ),
  config: z.object({
    credentialType: z.nativeEnum(CredentialType),
    participantNetworks: z.boolean(),
  }),
});

export const ListTicketsSchema = z.array(
  z.object({
    id: z.string(),
    eventSlug: z.string(),
    eventPhoto: z.string(),
    eventTitle: z.string(),
    eventStartAt: z.date(),
    eventLocation: z.nativeEnum(EventLocation),
    eventLatitude: z.string(),
    eventLongitude: z.string(),
    state: z.string(),
    city: z.string(),
    address: z.string(),
    complement: z.string(),
    country: z.string(),
    number: z.string(),
    district: z.string(),
  }),
);

export const EventTicketInfoSchema = z.object({
  eventPhoto: z.string(),
  eventTitle: z.string(),
  eventDescription: z.string(),
  eventState: z.string(),
  eventCity: z.string(),
  eventAddress: z.string(),
  eventNumber: z.string(),
  eventDistrict: z.string(),
  eventComplement: z.string(),
  eventLatitude: z.string(),
  eventLongitude: z.string(),
  eventStartAt: z.date(),
  eventEndAt: z.date(),

  eventParticipantId: z.string().nullish(),
  eventParticipantQrcode: z.string().nullish(),
  eventTicketTitle: z.string().nullish(),

  guests: z
    .array(
      z.object({
        participantId: z.string().nullish(),
        name: z.string().nullish(),
        ticketName: z.string().nullish(),
      }),
    )
    .nullish(),

  avaibleGuests: z.number(),
});

export const NetworkParticipantSchema = z.object({
  name: z.string(),
  profilePhoto: z.string(),

  userNetwork: z.array(
    z.object({
      id: z.number(),
      network: z.string(),
      username: z.string(),
    }),
  ),

  userHobbie: z.array(
    z.object({
      id: z.number(),
      description: z.string(),
      rating: z.number(),
    }),
  ),
});

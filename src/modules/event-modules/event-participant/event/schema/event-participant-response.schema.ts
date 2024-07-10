import {
  CredentialType,
  EventLocation,
  EventQuizStatus,
  QuestionType,
} from '@prisma/client';
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
      ticketDays: z.array(
        z.object({
          id: z.number(),
          day: z.date(),
        }),
      ),
    }),
  ),
  config: z.object({
    credentialType: z.nativeEnum(CredentialType),
    participantNetworks: z.boolean(),
  }),
  term: z.object({
    id: z.string(),
    name: z.string(),
    path: z.string(),
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
  eventParticipantDocument: z.string().nullish(),
  eventParticipantName: z.string().nullish(),
  eventTicketTitle: z.string().nullish(),

  guests: z
    .array(
      z.object({
        participantId: z.string().nullish(),
        name: z.string().nullish(),
        ticketName: z.string().nullish(),
        document: z.string().nullish(),
      }),
    )
    .nullish(),

  avaibleGuests: z.number(),

  links: z.array(
    z.object({
      id: z.string(),
      ticketId: z.string(),
      ticketName: z.string(),
      guests: z.number(),
      limit: z.number(),
    }),
  ),
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

export const NetworkHistoricSchema = z.object({
  id: z.string(),
  name: z.string(),
  eventName: z.string(),
  profilePhoto: z.string(),
});

export const FindByEmailSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phoneNumber: z.string(),
  phoneCountry: z.string(),
  city: z.string(),
  country: z.string(),
  state: z.string(),
  document: z.string(),
  validAt: z.date().nullish(),
});

export const ThanksScreenSchema = z.object({
  eventTitle: z.string(),
  eventCity: z.string(),
  evenState: z.string(),
  eventPhoto: z.string(),
  eventStartAt: z.date().nullish(),
  eventEndAt: z.date().nullish(),
  eventSlug: z.string(),

  eventParticipantTicketTitle: z.string(),
  eventParticipantName: z.string(),
  eventParticipantQrcode: z.string(),
});

export const QuizQuestionSchema = z.object({
  questionId: z.string(),
  description: z.string(),
  sequential: z.number(),
  questionType: z.nativeEnum(QuestionType),
  isMandatory: z.boolean(),
  multipleChoice: z.boolean(),
  options: z
    .array(
      z.object({
        optionId: z.string(),
        sequential: z.number(),
        description: z.string(),
        isOther: z.boolean(),
      }),
    )
    .optional(),
});

export const QuizSchema = z.object({
  quizId: z.string(),
  title: z.string(),
  startAt: z.date(),
  endAt: z.date(),
  status: z.nativeEnum(EventQuizStatus),
  anonimousResponse: z.boolean(),

  questions: z.array(QuizQuestionSchema),
});

export const QuizCreateResponseSchema = z.object({
  ok: z.string(),
});

export const FindTicketByLinkResponseSchema = z.object({
  id: z.string(),
  ticketName: z.string(),
  description: z.string(),
  ticketDays: z.array(
    z.object({
      id: z.number(),
      date: z.date(),
    }),
  ),
});

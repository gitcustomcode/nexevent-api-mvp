import { EventStaffStatus } from '@prisma/client';
import { z } from 'nestjs-zod/z';
export const EventProducerResponseCreateStaffSchema = z.array(
  z.object({
    id: z.string(),
    email: z.string().email(),
  }),
);

export const EventProducerResponseListStaffSchema = z.array(
  z.object({
    id: z.string(),
    email: z.string().email(),
    status: z.nativeEnum(EventStaffStatus)
  }),
);

export const EventProducerRecommendedStaffSchema = z.object({
  staffId: z.string(),
  staffName: z.string(),
  staffEmail: z.string().email(),

  eventCount: z.number(),

  events: z.array(
    z.object({
      eventId: z.string(),
      eventTitle: z.string(),
      eventDate: z.date(),
    }),
  ),
});


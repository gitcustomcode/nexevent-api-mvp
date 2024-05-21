import { z } from 'nestjs-zod/z';

export const EventProducerUpdate = z.object({
  title: z.string().nullish(),
  category: z.string().nullish(),
  subtitle: z.string().nullish(),
  description: z.string().nullish(),
  location: z.string().nullish(),
  eventPublic: z.boolean().nullish(),
  startAt: z.date().nullish(),
  endAt: z.date().nullish(),
  startPublishAt: z.date().nullish(),
  endPublishAt: z.date().nullish(),
});

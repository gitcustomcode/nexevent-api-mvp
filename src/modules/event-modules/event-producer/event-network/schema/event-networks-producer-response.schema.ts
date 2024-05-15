import { z } from 'nestjs-zod/z';

export const EventNetworksProducerResponseSchema = z.array(
  z.object({
    id: z.number(),
    network: z.string(),
    uri: z.string(),
    description: z.string(),
  }),
);

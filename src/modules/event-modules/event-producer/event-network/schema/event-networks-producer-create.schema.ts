import { z } from 'nestjs-zod/z';

export const EventNetworksProducerCreateSchema = z.array(
  z.object({
    network: z.string().describe('Network name'),
    uri: z.string().describe('Network url'),
    description: z.string().nullish().describe('Network description'),
  }),
);

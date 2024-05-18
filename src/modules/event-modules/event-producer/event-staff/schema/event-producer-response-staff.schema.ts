import { z } from 'nestjs-zod/z';

export const EventProducerResponseCreateStaffSchema = z.array(
  z.object({
    id: z.string(),
    email: z.string().email(),
  }),
);

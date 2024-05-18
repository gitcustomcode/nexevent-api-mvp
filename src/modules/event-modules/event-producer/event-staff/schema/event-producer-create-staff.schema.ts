import { z } from 'nestjs-zod/z';

export const EventProducerCreateStaffSchema = z.array(
  z.object({
    email: z.string(),
    password: z.string(),
  }),
);

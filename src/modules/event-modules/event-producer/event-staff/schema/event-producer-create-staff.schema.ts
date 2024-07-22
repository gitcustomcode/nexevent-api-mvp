import { z } from 'nestjs-zod/z';

export const EventProducerCreateStaffSchema = z.object({
  email: z.string().email(),
});

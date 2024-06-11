import { z } from 'nestjs-zod/z';

export const CheckoutSessionEventParticipantSchema = z.array(
  z.object({
    price: z.string(),
    quantity: z.number(),
  }),
);

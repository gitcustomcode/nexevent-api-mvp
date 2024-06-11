import { createZodDto } from 'nestjs-zod';
import { CheckoutSessionEventParticipantSchema } from 'src/schemas/stripe.schema';

export class CheckoutSessionEventParticipantDto extends createZodDto(
  CheckoutSessionEventParticipantSchema,
) {}

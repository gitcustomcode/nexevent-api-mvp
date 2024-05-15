import { z } from 'nestjs-zod/z';

export const UserProducerFinishSignUpSchema = z.object({
  name: z.string().describe('User name'),
  dateBirth: z.string().describe('User birth date'),
  document: z.string().describe('User document'),
  phoneCountry: z.string().describe('User phone country'),
  phoneNumber: z.string().describe('User phone number'),
});

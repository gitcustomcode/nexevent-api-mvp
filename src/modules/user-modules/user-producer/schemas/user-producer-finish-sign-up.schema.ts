import { z } from 'nestjs-zod/z';

export const UserProducerFinishSignUpSchema = z.object({
  name: z.string().optional().describe('User name'),
  dateBirth: z.string().optional().describe('User birth date'),
  document: z.string().optional().describe('User document'),
  phoneCountry: z.string().optional().describe('User phone country'),
  phoneNumber: z.string().optional().describe('User phone number'),
  street: z.string().optional().describe('User street'),
  district: z.string().optional().describe('User district'),
  state: z.string().optional().describe('User state'),
  city: z.string().optional().describe('User city'),
  country: z.string().optional().describe('User country'),
  number: z.string().optional().describe('User number'),
  complement: z.string().optional().describe('User complement'),
  cep: z.string().optional().describe('User cep'),
});

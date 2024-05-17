import { z } from 'nestjs-zod/z';

export const UserProducerResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  dateBirth: z.string(),
  document: z.string(),
  phoneCountry: z.string(),
  phoneNumber: z.string(),
  profilePhoto: z.string(),
  street: z.string(),
  district: z.string(),
  state: z.string(),
  city: z.string(),
  country: z.string(),
  number: z.string(),
  complement: z.string(),
  cep: z.string(),
  createdAt: z.date(),
  events: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
    })),

});

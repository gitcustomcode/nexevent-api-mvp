import { z } from 'nestjs-zod/z';

export const UserProducerCreateSchema = z.object({
  email: z.string().email().describe('User email'),
  password: z.string().min(8).describe('User password'),
  confirmPassword: z.string().min(8).describe('User confirm password'),
});

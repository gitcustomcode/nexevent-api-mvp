import { UserType } from '@prisma/client';import { z } from 'nestjs-zod/z';

export const LoginResponseSchema = z.object({
  token: z.string(),
  userType: z.nativeEnum(UserType),
  haveTickets: z.boolean(),
  haveEvents: z.boolean(),
});

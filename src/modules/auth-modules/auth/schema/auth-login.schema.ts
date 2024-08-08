import { z } from 'nestjs-zod/z';

export const AuthLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

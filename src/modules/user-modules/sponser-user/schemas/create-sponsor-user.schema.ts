import { z } from 'nestjs-zod/z';

export const CreateSponsorUserSchema = z.object({
  publicKey: z.string(),
  secretKey: z.string(),
});

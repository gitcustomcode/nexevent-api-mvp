import { z } from 'nestjs-zod/z';

export const ResponseSponsorUserSchema = z.object({
  id: z.string(),
  userId: z.string(),
  secretKey: z.string(),
  publicKey: z.string(),
});

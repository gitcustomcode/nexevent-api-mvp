import { z } from 'nestjs-zod/z';

export const UpdateSponsorUserSchema = z.object({
  publicKey: z.string().nullish(),
  secretKey: z.string().nullish(),
});

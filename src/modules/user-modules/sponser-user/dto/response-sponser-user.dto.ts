import { createZodDto } from 'nestjs-zod';
import { ResponseSponsorUserSchema } from '../schemas/response-sponsor-user.schema';

export class ResponseSponsorUserDto extends createZodDto(
  ResponseSponsorUserSchema,
) {}

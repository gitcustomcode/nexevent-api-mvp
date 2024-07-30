import { createZodDto } from 'nestjs-zod';
import { CreateSponsorUserSchema } from '../schemas/create-sponsor-user.schema';

export class CreateSponsorUserDto extends createZodDto(
  CreateSponsorUserSchema,
) {}

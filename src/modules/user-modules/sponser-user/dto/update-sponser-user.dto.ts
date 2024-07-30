import { createZodDto } from 'nestjs-zod';
import { UpdateSponsorUserSchema } from '../schemas/update-sponsor-user.schema';

export class UpdateSponsorUserDto extends createZodDto(
  UpdateSponsorUserSchema,
) {}

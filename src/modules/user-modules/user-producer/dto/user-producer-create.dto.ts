import { createZodDto } from 'nestjs-zod';
import { UserProducerCreateSchema } from '../schemas/user-producer-create.schema';

export class UserProducerCreateDto extends createZodDto(
  UserProducerCreateSchema,
) {}

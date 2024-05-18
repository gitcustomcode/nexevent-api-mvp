import { createZodDto } from 'nestjs-zod';
import { UserProducerResponseSchema } from '../schemas/user-producer-response.schema';

export class UserProducerResponseDto extends createZodDto(
  UserProducerResponseSchema,
) {}

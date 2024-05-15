import { createZodDto } from 'nestjs-zod';
import { UserProducerFinishSignUpSchema } from '../schemas/user-producer-finish-sign-up.schema';

export class UserProducerFinishSignUpDto extends createZodDto(
  UserProducerFinishSignUpSchema,
) {}

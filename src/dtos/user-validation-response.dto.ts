import { createZodDto } from 'nestjs-zod';
import {
  UserEventParticipantCreateSchema,
  UserValidationEmailResponseSchema,
} from 'src/schemas/user-validation-response.schema';

export class UserValidationEmailResponseDto extends createZodDto(
  UserValidationEmailResponseSchema,
) {}

export class UserEventParticipantCreateDto extends createZodDto(
  UserEventParticipantCreateSchema,
) {}

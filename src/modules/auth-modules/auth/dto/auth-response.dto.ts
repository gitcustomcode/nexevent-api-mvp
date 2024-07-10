import { createZodDto } from 'nestjs-zod';
import { LoginResponseSchema } from '../schema/auth-response.schema';

export class LoginResponseDto extends createZodDto(LoginResponseSchema) {}

import { createZodDto } from 'nestjs-zod';
import { AuthLoginSchema } from '../schema/auth-login.schema';

export class AuthLoginDto extends createZodDto(AuthLoginSchema) {}

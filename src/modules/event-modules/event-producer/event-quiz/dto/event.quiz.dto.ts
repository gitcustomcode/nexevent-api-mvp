import { createZodDto } from 'nestjs-zod';
import { EventQuizCreateSchema } from '../schema/event-quiz-create.schema';

export class EventQuizCreateDto extends createZodDto(EventQuizCreateSchema) {}

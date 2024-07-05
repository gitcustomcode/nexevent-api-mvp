import { createZodDto } from 'nestjs-zod';
import {
  EventQuizCreateSchema,
  EventQuizQuestionCreateSchema,
} from '../schema/event-quiz-create.schema';

export class EventQuizQuestionCreateDto extends createZodDto(
  EventQuizQuestionCreateSchema,
) {}

export class EventQuizCreateDto extends createZodDto(EventQuizCreateSchema) {}

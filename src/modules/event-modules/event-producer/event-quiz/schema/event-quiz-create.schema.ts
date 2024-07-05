import { EventQuizStatus, QuestionType } from '@prisma/client';
import { z } from 'nestjs-zod/z';

function parseDate(value: string): Date {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date string');
  }
  return date;
}

export const EventQuizQuestionOptionCreateSchema = z.object({
  sequential: z.number(),
  description: z.string(),
  isOther: z.boolean(),
});

export const EventQuizQuestionCreateSchema = z.object({
  description: z.string(),
  sequential: z.number(),
  questionType: z.nativeEnum(QuestionType),
  isMandatory: z.boolean(),
  multipleChoice: z.boolean(),

  questionOptions: z.array(EventQuizQuestionOptionCreateSchema).optional(),
});

export const EventQuizCreateSchema = z.object({
  title: z.string(),
  startAt: z.string().transform(parseDate),
  endAt: z.string().transform(parseDate),
  anonimousResponse: z.boolean(),
  status: z.nativeEnum(EventQuizStatus),

  questions: z.array(EventQuizQuestionCreateSchema),
});

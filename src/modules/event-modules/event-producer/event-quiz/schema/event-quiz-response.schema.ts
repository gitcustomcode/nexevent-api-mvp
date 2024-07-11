import { EventQuizStatus, QuestionType } from '@prisma/client';import { z } from 'nestjs-zod/z';
import { QuizQuestionSchema } from 'src/modules/event-modules/event-participant/event/schema/event-participant-response.schema';

export const EventQuizFindAllResponseSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    startAt: z.date(),
    endAt: z.date(),
    status: z.nativeEnum(EventQuizStatus),
    responses: z.number(),
  }),
);

export const EventQuizDashboardSchema = z.object({
  id: z.string(),
  title: z.string(),

  multipleChoice: z
    .array(
      z.object({
        questionId: z.string(),
        totalResponses: z.number(),
        options: z.array(
          z.object({
            optionId: z.string(),
            optionTitle: z.string(),
            optionReponseTotal: z.string(),
          }),
        ),
      }),
    )
    .optional(),

  rating: z
    .array(
      z.object({
        questionId: z.string(),
        totalResponses: z.number(),

        ratings: z.array(
          z.object({
            rating: z.number(),
            ratingResponseTotal: z.number(),
          }),
        ),
      }),
    )
    .optional(),
});

export const EventQuizParticipantsResponseSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    responses: z.string(),
  }),
);

export const EventParticipantQuestionResponseSchema = z.object({
  responseId: z.string(),
  eventQuizQuestionId: z.string(),
  questionDescription: z.string(),
  sequential: z.number(),
  questionType: z.nativeEnum(QuestionType),
  isMandatory: z.boolean(),
  multipleChoice: z.boolean(),

  rating: z.number().optional(),
  response: z.string().nullish().optional(),
  eventQuizQuestionOption: z
    .array(
      z.object({
        eventQuizQuestionOptionId: z.string(),
        optionDescription: z.string(),
        isOther: z.boolean(),
        userResponse: z.boolean(),
      }),
    )
    .optional(),
});

export const EventParticipantResponseSchema = z.object({
  quizParticipantId: z.string(),
  quizTitle: z.string(),
  participantName: z.string(),
  participantEmail: z.string(),

  questionsResponses: z.array(EventParticipantQuestionResponseSchema),
});

export const EventQuizCreatedResponseSchema = z.object({
  ok: z.string(),
});

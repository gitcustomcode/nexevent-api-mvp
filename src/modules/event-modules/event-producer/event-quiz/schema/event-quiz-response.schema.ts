import { EventQuizStatus } from '@prisma/client';
import { z } from 'nestjs-zod/z';

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

export const EventQuizCreatedResponseSchema = z.object({
  ok: z.string(),
});

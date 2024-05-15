import { z } from 'nestjs-zod/z';

export const PaginationResponseSchema = z.object({
  totalItems: z.number(),
  totalPages: z.number(),
  remainingPages: z.number(),
  nextPage: z.number().nullable(),
  prevPage: z.number().nullable(),
});

export const PaginationParamsSchema = z.object({
  totalItems: z.number(),
  page: z.number(),
  perPage: z.number(),
});

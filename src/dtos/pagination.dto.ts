import { createZodDto } from 'nestjs-zod';
import {
  PaginationParamsSchema,
  PaginationResponseSchema,
} from 'src/schemas/pagination.schema';

export class PaginationResponse extends createZodDto(
  PaginationResponseSchema,
) {}

export class PaginationParamns extends createZodDto(PaginationParamsSchema) {}

import { createZodDto } from 'nestjs-zod';
import { EventAllResponseSchema, EventDashboardResponseSchema } from '../schema/event-producer-response.schema';

export class EventDashboardResponseDto extends createZodDto(
  EventDashboardResponseSchema,
) {}
export class EventAllResponseDto extends createZodDto(
  EventAllResponseSchema,
) {}

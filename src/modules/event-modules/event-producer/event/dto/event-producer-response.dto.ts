import { createZodDto } from 'nestjs-zod';
import { EventDashboardResponseSchema } from '../schema/event-producer-response.schema';

export class EventDashboardResponseDto extends createZodDto(
  EventDashboardResponseSchema,
) {}

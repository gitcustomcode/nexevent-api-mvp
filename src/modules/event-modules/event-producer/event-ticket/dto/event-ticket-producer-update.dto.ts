import { createZodDto } from 'nestjs-zod';
import { EventTicketUpdateSchema } from '../schema/event-ticket-producer-update.schema';

export class EventTicketUpdateDto extends createZodDto(
  EventTicketUpdateSchema,
) {}

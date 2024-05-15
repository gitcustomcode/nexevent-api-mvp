import { createZodDto } from 'nestjs-zod';
import { EventTicketCreateSchema } from '../schema/event-ticket-producer-create.schema';

export class EventTicketCreateDto extends createZodDto(
  EventTicketCreateSchema,
) {}

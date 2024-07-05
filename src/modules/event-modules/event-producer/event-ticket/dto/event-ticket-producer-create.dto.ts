import { createZodDto } from 'nestjs-zod';
import {
  EventTicketCouponsSchema,
  EventTicketCreateSchema,
} from '../schema/event-ticket-producer-create.schema';

export class EventTicketCreateDto extends createZodDto(
  EventTicketCreateSchema,
) {}

export class EventTicketCouponsDto extends createZodDto(
  EventTicketCouponsSchema,
) {}

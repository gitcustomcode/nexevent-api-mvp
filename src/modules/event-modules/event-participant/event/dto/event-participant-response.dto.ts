import { createZodDto } from 'nestjs-zod';
import { ParticipantTicketSchema } from '../schema/event-participant-response.schema';

export class ParticipantTicketDto extends createZodDto(
  ParticipantTicketSchema,
) {}

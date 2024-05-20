import { createZodDto } from 'nestjs-zod';
import {
  FindEventInfoSchema,
  ParticipantTicketSchema,
} from '../schema/event-participant-response.schema';

export class ParticipantTicketDto extends createZodDto(
  ParticipantTicketSchema,
) {}

export class FindEventInfoDto extends createZodDto(FindEventInfoSchema) {}

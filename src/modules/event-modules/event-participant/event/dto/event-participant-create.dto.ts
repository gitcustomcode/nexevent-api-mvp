import { createZodDto } from 'nestjs-zod';
import { EventParticipantCreateSchema } from '../schema/event-participant-create.schema';

export class EventParticipantCreateDto extends createZodDto(
  EventParticipantCreateSchema,
) {}

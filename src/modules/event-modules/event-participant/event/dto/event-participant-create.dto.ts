import { createZodDto } from 'nestjs-zod';
import {
  EventParticipantCreateNetworksSchema,
  EventParticipantCreateSchema,
} from '../schema/event-participant-create.schema';

export class EventParticipantCreateDto extends createZodDto(
  EventParticipantCreateSchema,
) {}

export class EventParticipantCreateNetworksDto extends createZodDto(
  EventParticipantCreateNetworksSchema,
) {}

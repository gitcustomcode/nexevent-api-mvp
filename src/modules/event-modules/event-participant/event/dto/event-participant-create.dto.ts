import { createZodDto } from 'nestjs-zod';import {
  CreateParticipantQuizResponses,
  EventParticipantCreateNetworksSchema,
  EventParticipantCreateSchema,
  EventTicketSellSchema,
} from '../schema/event-participant-create.schema';

export class EventParticipantCreateDto extends createZodDto(
  EventParticipantCreateSchema,
) {}

export class EventParticipantCreateNetworksDto extends createZodDto(
  EventParticipantCreateNetworksSchema,
) {}

export class EventTicketSellDto extends createZodDto(EventTicketSellSchema) {}

export class CreateParticipantQuizDto extends createZodDto(
  CreateParticipantQuizResponses,
) {}

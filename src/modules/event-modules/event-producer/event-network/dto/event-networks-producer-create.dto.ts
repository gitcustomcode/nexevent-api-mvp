import { createZodDto } from 'nestjs-zod';
import { EventNetworksProducerCreateSchema } from '../schema/event-networks-producer-create.schema';

export class EventNetworksProducerCreateDto extends createZodDto(
  EventNetworksProducerCreateSchema,
) {}

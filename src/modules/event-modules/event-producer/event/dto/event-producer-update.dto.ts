import { createZodDto } from 'nestjs-zod';
import { EventProducerUpdate } from '../schema/event-producer-update.schema';

export class EventProducerUpdateDto extends createZodDto(EventProducerUpdate) {}

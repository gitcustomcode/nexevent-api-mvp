import { createZodDto } from 'nestjs-zod';
import {
  EventProducerUpdate,
  EventProducerUpgradeSchema,
} from '../schema/event-producer-update.schema';

export class EventProducerUpdateDto extends createZodDto(EventProducerUpdate) {}

export class EventProducerUpgradeDto extends createZodDto(
  EventProducerUpgradeSchema,
) {}

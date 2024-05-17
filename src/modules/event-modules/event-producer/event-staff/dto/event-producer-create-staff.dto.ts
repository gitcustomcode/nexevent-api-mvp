import { createZodDto } from 'nestjs-zod';
import { EventProducerCreateStaffSchema } from '../schema/event-producer-create-staff.schema';

export class EventProducerCreateStaffDto extends createZodDto(
  EventProducerCreateStaffSchema,
) {}

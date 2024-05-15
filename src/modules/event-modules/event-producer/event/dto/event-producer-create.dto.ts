import { createZodDto } from 'nestjs-zod';
import { EventCreateSchema } from '../schema/event-producer-create.schema';

export class EventCreateDto extends createZodDto(EventCreateSchema) {}

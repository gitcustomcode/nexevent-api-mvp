import { createZodDto } from 'nestjs-zod';
import {
  EventAllResponseSchema,
  EventDashboardResponseSchema,
  GeneralDashboardResponseSchema,
} from '../schema/event-producer-response.schema';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from 'src/dtos/pagination.dto';

export class EventDashboardResponseDto extends createZodDto(
  EventDashboardResponseSchema,
) {}

export class EventAllResponseDto extends createZodDto(EventAllResponseSchema) {}

export class ResponseEvents {
  @ApiProperty({
    type: () => EventAllResponseDto,
  })
  data: EventAllResponseDto;

  @ApiProperty({ type: PaginationResponse, nullable: true })
  pageInfo: PaginationResponse;
}

export class GeneralDashboardResponseDto extends createZodDto(
  GeneralDashboardResponseSchema,
) {}

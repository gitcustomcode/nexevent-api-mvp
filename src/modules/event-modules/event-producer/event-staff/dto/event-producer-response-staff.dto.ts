import { createZodDto } from 'nestjs-zod';
import {
  EventProducerRecommendedStaffSchema,
  EventProducerResponseCreateStaffSchema,
  EventProducerResponseListStaffSchema,
} from '../schema/event-producer-response-staff.schema';
import { PaginationResponse } from 'src/dtos/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';

export class EventProducerResponseCreateStaffDto extends createZodDto(
  EventProducerResponseCreateStaffSchema,
) {}

export class EventProducerResponseListStaffDto extends createZodDto(
  EventProducerResponseListStaffSchema,
) {}

export class EventStaffsResponse {
  @ApiProperty({
    type: () => EventProducerResponseListStaffDto,
  })
  data: EventProducerResponseListStaffDto;

  @ApiProperty({ type: PaginationResponse, nullable: true })
  pageInfo: PaginationResponse;
}

export class EventProducerRecommendedStaffDto extends createZodDto(
  EventProducerRecommendedStaffSchema,
) {}

export class EventProducerRecommendedStaffs {
  @ApiProperty({
    type: () => [EventProducerRecommendedStaffDto],
  })
  data: EventProducerRecommendedStaffDto[];

  @ApiProperty({ type: PaginationResponse, nullable: true })
  pageInfo: PaginationResponse;
}

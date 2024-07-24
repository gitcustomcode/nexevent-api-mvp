import { createZodDto } from 'nestjs-zod';
import {
  EventProducerRecommendedStaffSchema,
  EventProducerResponseCreateStaffSchema,
  EventStaffAllResponseSchema,
} from '../schema/event-producer-response-staff.schema';
import { PaginationResponse } from 'src/dtos/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';

export class EventProducerResponseCreateStaffDto extends createZodDto(
  EventProducerResponseCreateStaffSchema,
) {}

export class EventStaffsResponse {
  @ApiProperty({
    type: () => EventProducerResponseCreateStaffDto,
  })
  data: EventProducerResponseCreateStaffDto;

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

export class EventStaffAllResponseDto extends createZodDto(
  EventStaffAllResponseSchema,
) {}

export class ResponseStaffEvents {
  @ApiProperty({
    type: () => EventStaffAllResponseDto,
  })
  data: EventStaffAllResponseDto;

  @ApiProperty({ type: PaginationResponse, nullable: true })
  pageInfo: PaginationResponse;
}

import { createZodDto } from 'nestjs-zod';
import { EventProducerResponseCreateStaffSchema } from '../schema/event-producer-response-staff.schema';
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
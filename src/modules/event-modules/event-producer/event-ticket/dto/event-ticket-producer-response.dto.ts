import { createZodDto } from 'nestjs-zod';
import { EventTicketDashboardResponseSchema } from '../schema/event-ticket-producer-response.schema';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from 'src/dtos/pagination.dto';

export class EventTicketDashboardResponseDto extends createZodDto(
  EventTicketDashboardResponseSchema,
) {}

export class EventTicketsResponse {
  @ApiProperty({
    type: () => EventTicketDashboardResponseDto,
  })
  data: EventTicketDashboardResponseDto;

  @ApiProperty({ type: PaginationResponse, nullable: true })
  pageInfo: PaginationResponse;
}

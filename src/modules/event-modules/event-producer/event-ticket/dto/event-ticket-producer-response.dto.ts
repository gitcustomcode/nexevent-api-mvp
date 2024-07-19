import { createZodDto } from 'nestjs-zod';
import {
  EventTicketCouponDashboardSchema,
  EventTicketCouponResponseSchema,
  EventTicketDashboardResponseSchema,
  EventTicketLinkByEmailSchema,
  EventTicketLinkCreateSchema,
  EventTicketLinkResponseSchema,
} from '../schema/event-ticket-producer-response.schema';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from 'src/dtos/pagination.dto';

export class EventTicketDashboardResponseDto extends createZodDto(
  EventTicketDashboardResponseSchema,
) {}

export class EventTicketCouponResponseDto extends createZodDto(
  EventTicketCouponResponseSchema,
) {}

export class EventTicketCouponDashboardDto extends createZodDto(
  EventTicketCouponDashboardSchema,
) {}

export class EventTicketLinkResponseDto extends createZodDto(
  EventTicketLinkResponseSchema,
) {}

export class EventTicketLinkByEmailResponseDto extends createZodDto(
  EventTicketLinkByEmailSchema,
) {}

export class EventTicketLinkCreateResponseDto extends createZodDto(
  EventTicketLinkCreateSchema,
) {}

export class EventTicketLinkCreateResponse{
  @ApiProperty({
    type: () => EventTicketLinkCreateResponseDto,
  })
  data: EventTicketLinkCreateResponseDto;
}


export class EventTicketsResponse {
  @ApiProperty({
    type: () => EventTicketDashboardResponseDto,
  })
  data: EventTicketDashboardResponseDto;

  @ApiProperty({ type: PaginationResponse, nullable: true })
  pageInfo: PaginationResponse;
}

export class EventTicketCouponsResponse {
  @ApiProperty({
    type: () => [EventTicketCouponResponseDto],
  })
  data: EventTicketCouponResponseDto[];

  @ApiProperty({ type: PaginationResponse, nullable: true })
  pageInfo: PaginationResponse;
}

export class EventTicketLinkResponse {
  @ApiProperty({
    type: () => EventTicketLinkResponseDto,
  })
  data: EventTicketLinkResponseDto;

  @ApiProperty({ type: PaginationResponse, nullable: true })
  pageInfo: PaginationResponse;
}

export class EventTicketLinkByEmailResponse {
  @ApiProperty({
    type: ()=> EventTicketLinkByEmailResponseDto,
  })
  data: EventTicketLinkByEmailResponseDto;
}
import { createZodDto } from 'nestjs-zod';
import {
  EventAllResponseSchema,
  EventDashboardPanelFinancialSchema,
  EventDashboardResponseSchema,
  EventParticipantsResponseSchema,
  FindOneDashboardParticipantPanelSchema,
  GeneralDashboardResponseSchema,
} from '../schema/event-producer-response.schema';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from 'src/dtos/pagination.dto';

export class EventDashboardResponseDto extends createZodDto(
  EventDashboardResponseSchema,
) {}

export class EventAllResponseDto extends createZodDto(EventAllResponseSchema) {}

export class FindOneDashboardParticipantPanelDto extends createZodDto(
  FindOneDashboardParticipantPanelSchema,
) {}

export class EventDashboardPanelFinancialDto extends createZodDto(
  EventDashboardPanelFinancialSchema,
) {}

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

export class EventParticipantsResponseDto extends createZodDto(
  EventParticipantsResponseSchema,
) {}

export class ResponseEventParticipants {
  @ApiProperty({
    type: () => EventParticipantsResponseDto,
  })
  data: EventParticipantsResponseDto;

  @ApiProperty({ type: PaginationResponse, nullable: true })
  pageInfo: PaginationResponse;
}

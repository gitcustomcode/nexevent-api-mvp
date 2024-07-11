import { createZodDto } from 'nestjs-zod';
import {
  EventParticipantQuestionResponseSchema,
  EventParticipantResponseSchema,
  EventQuizCreatedResponseSchema,
  EventQuizDashboardSchema,
  EventQuizFindAllResponseSchema,
  EventQuizParticipantsResponseSchema,
} from '../schema/event-quiz-response.schema';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from 'src/dtos/pagination.dto';

export class EventQuizFindAllResponseDto extends createZodDto(
  EventQuizFindAllResponseSchema,
) {}

export class EventQuizDashboarDto extends createZodDto(
  EventQuizDashboardSchema,
) {}

export class EventQuizParticipantsResponseDto extends createZodDto(
  EventQuizParticipantsResponseSchema,
) {}

export class EventQuizCreatedResponseDto extends createZodDto(
  EventQuizCreatedResponseSchema,
) {}

export class EventParticipantResponseDto extends createZodDto(
  EventParticipantResponseSchema,
) {}

export class EventParticipantQuestionResponseDto extends createZodDto(
  EventParticipantQuestionResponseSchema,
) {}

export class EventQuizFindAllResponse {
  @ApiProperty({
    type: () => EventQuizFindAllResponseDto,
  })
  data: EventQuizFindAllResponseDto;

  @ApiProperty({ type: PaginationResponse, nullable: true })
  pageInfo: PaginationResponse;
}

export class EventQuizParticipantsResponse {
  @ApiProperty({
    type: () => EventQuizParticipantsResponseDto,
  })
  data: EventQuizParticipantsResponseDto;

  @ApiProperty({ type: PaginationResponse, nullable: true })
  pageInfo: PaginationResponse;
}

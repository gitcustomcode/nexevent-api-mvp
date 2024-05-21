import { createZodDto } from 'nestjs-zod';
import {
  FindAllPublicEventsSchema,
  FindEventInfoSchema,
  FindOnePublicEventsSchema,
  ParticipantTicketSchema,
} from '../schema/event-participant-response.schema';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from 'src/dtos/pagination.dto';

export class ParticipantTicketDto extends createZodDto(
  ParticipantTicketSchema,
) {}

export class FindEventInfoDto extends createZodDto(FindEventInfoSchema) {}

export class FindAllPublicEventsDto extends createZodDto(
  FindAllPublicEventsSchema,
) {}

export class FindOnePublicEventsDto extends createZodDto(
  FindOnePublicEventsSchema,
) {}

export class FindAllPublicEvents {
  @ApiProperty({
    type: () => FindAllPublicEventsDto,
  })
  data: FindAllPublicEventsDto;

  @ApiProperty({ type: PaginationResponse, nullable: true })
  pageInfo: PaginationResponse;
}

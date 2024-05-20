import { createZodDto } from 'nestjs-zod';
import {
  GetEventConfigSchema,
  LastAccreditedParticipantsSchema,
} from '../schema/event-producer-accreditation-response.schema';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from 'src/dtos/pagination.dto';

export class LastAccreditedParticipantsDto extends createZodDto(
  LastAccreditedParticipantsSchema,
) {}

export class GetEventConfigDto extends createZodDto(GetEventConfigSchema) {}

export class LastAccreditedParticipantsResponse {
  @ApiProperty({
    type: () => LastAccreditedParticipantsDto,
  })
  data: LastAccreditedParticipantsDto;

  @ApiProperty({ type: PaginationResponse, nullable: true })
  pageInfo: PaginationResponse;
}

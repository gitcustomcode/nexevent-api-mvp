import { createZodDto } from 'nestjs-zod';
import { LastAccreditedParticipantsSchema } from '../schema/event-producer-accreditation-response.schema';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from 'src/dtos/pagination.dto';

export class LastAccreditedParticipantsDto extends createZodDto(
  LastAccreditedParticipantsSchema,
) {}

export class LastAccreditedParticipantsResponse {
  @ApiProperty({
    type: () => LastAccreditedParticipantsDto,
  })
  data: LastAccreditedParticipantsDto;

  @ApiProperty({ type: PaginationResponse, nullable: true })
  pageInfo: PaginationResponse;
}

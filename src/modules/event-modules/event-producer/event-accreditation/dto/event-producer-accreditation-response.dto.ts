import { createZodDto } from 'nestjs-zod';import {
  FindByFacialResponseSchema,
  FindByQrCodeResponseSchema,
  GetEventConfigSchema,
  LastAccreditedParticipantsSchema,
} from '../schema/event-producer-accreditation-response.schema';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from 'src/dtos/pagination.dto';

export class LastAccreditedParticipantsDto extends createZodDto(
  LastAccreditedParticipantsSchema,
) {}

export class GetEventConfigDto extends createZodDto(GetEventConfigSchema) {}

export class FindByFacialResponseDto extends createZodDto(
  FindByFacialResponseSchema,
) {}

export class FindByQrCodeResponseDto extends createZodDto(
  FindByQrCodeResponseSchema,
) {}

export class LastAccreditedParticipantsResponse {
  @ApiProperty({
    type: () => LastAccreditedParticipantsDto,
  })
  data: LastAccreditedParticipantsDto;

  @ApiProperty({ type: PaginationResponse, nullable: true })
  pageInfo: PaginationResponse;
}

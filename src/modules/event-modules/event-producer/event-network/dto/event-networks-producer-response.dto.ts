import { createZodDto } from 'nestjs-zod';
import { EventNetworksProducerResponseSchema } from '../schema/event-networks-producer-response.schema';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from 'src/dtos/pagination.dto';

export class EventNetworksProducerResponseDto extends createZodDto(
  EventNetworksProducerResponseSchema,
) {}

export class EventNetworksResponse {
  @ApiProperty({
    type: () => EventNetworksProducerResponseDto,
  })
  data: EventNetworksProducerResponseDto;

  @ApiProperty({ type: PaginationResponse, nullable: true })
  pageInfo: PaginationResponse;
}

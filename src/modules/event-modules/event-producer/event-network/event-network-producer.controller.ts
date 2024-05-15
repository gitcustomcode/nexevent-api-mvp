import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EventNetworksProducerService } from './event-network-producer.service';
import { AuthUserGuard } from 'src/modules/auth-modules/auth/auth-user.guards';
import { EventNetworksProducerCreateDto } from './dto/event-networks-producer-create.dto';
import { EventNetworksResponse } from './dto/event-networks-producer-response.dto';

@ApiTags('Event Producer')
@Controller('event-producer')
export class EventNetworkProducerController {
  constructor(
    private readonly eventNetworksProducerService: EventNetworksProducerService,
  ) {}

  @Post('v1/event-producer/:eventSlug/create-networks')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Create event networks' })
  @ApiCreatedResponse({
    description: 'event networks created',
    type: String,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'eventSlug',
    required: true,
    type: String,
  })
  @ApiBody({
    type: EventNetworksProducerCreateDto,
  })
  async createEventNetworks(
    @Param('eventSlug') eventSlug: string,
    @Body() body: EventNetworksProducerCreateDto,
    @Request() req: any,
  ) {
    const email = req.auth.user.email;
    return this.eventNetworksProducerService.createEventNetworks(
      email,
      eventSlug,
      body,
    );
  }

  @Get('v1/event-producer/:eventSlug/get-networks/')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Get event networks' })
  @ApiResponse({
    description: 'event networks',
    type: EventNetworksResponse,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'eventSlug',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'page',
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'perPage',
    required: true,
    type: Number,
  })
  async findAllEventNetworks(
    @Param('eventSlug') eventSlug: string,
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
  ): Promise<EventNetworksResponse> {
    const email = req.auth.user.email;
    return this.eventNetworksProducerService.findAllEventNetworks(
      email,
      eventSlug,
      page,
      perPage,
    );
  }
}

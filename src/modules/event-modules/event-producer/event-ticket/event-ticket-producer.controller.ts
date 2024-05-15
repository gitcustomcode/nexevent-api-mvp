import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { EventTicketProducerService } from './event-ticket-producer.service';
import { AuthUserGuard } from 'src/modules/auth-modules/auth/auth-user.guards';
import { EventTicketCreateDto } from './dto/event-ticket-producer-create.dto';
import { EventTicketUpdateDto } from './dto/event-ticket-producer-update.dto';
import { EventTicketsResponse } from './dto/event-ticket-producer-response.dto';

@ApiTags('Event Producer')
@Controller('event-producer')
export class EventTicketProducerController {
  constructor(
    private readonly eventTicketProducerService: EventTicketProducerService,
  ) {}

  @Post('v1/event-producer/:eventSlug/create-ticket')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Create event ticket' })
  @ApiCreatedResponse({
    description: 'event ticket created',
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
    type: EventTicketCreateDto,
  })
  async createEventTicket(
    @Param('eventSlug') eventSlug: string,
    @Body() body: EventTicketCreateDto,
    @Request() req: any,
  ) {
    const email = req.auth.user.email;
    return this.eventTicketProducerService.createEventTicket(
      email,
      eventSlug,
      body,
    );
  }

  @Patch('v1/event-producer/:eventSlug/update-ticket/:eventTicketId')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Update event ticket' })
  @ApiResponse({
    description: 'event ticket updated',
    type: String,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'eventSlug',
    required: true,
    type: String,
  })
  @ApiParam({
    name: 'eventTicketId',
    required: true,
    type: String,
  })
  @ApiBody({
    type: EventTicketUpdateDto,
  })
  async updateEventTicket(
    @Param('eventSlug') eventSlug: string,
    @Param('eventTicketId') eventTicketId: string,
    @Body() body: EventTicketUpdateDto,
    @Request() req: any,
  ) {
    const email = req.auth.user.email;
    return this.eventTicketProducerService.updateEventTicket(
      email,
      eventSlug,
      eventTicketId,
      body,
    );
  }

  @Get('v1/event-producer/:eventSlug/get-tickets/')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Get event tickets' })
  @ApiResponse({
    description: 'event tickets',
    type: EventTicketsResponse,
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
  async findAllEventTicket(
    @Param('eventSlug') eventSlug: string,
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
  ): Promise<EventTicketsResponse> {
    const email = req.auth.user.email;
    return this.eventTicketProducerService.findAllEventTicket(
      email,
      eventSlug,
      page,
      perPage,
    );
  }
}

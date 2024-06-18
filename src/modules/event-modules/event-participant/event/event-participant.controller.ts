import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EventParticipantService } from './event-participant.service';
import {
  EventParticipantCreateDto,
  EventParticipantCreateNetworksDto,
  EventTicketSellDto,
} from './dto/event-participant-create.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  EventTicketInfoDto,
  FindAllPublicEvents,
  FindEventInfoDto,
  FindOnePublicEventsDto,
  ListTickets,
  NetworkParticipantDto,
  ParticipantTicketDto,
} from './dto/event-participant-response.dto';
import { ClickSignApiService } from 'src/services/click-sign.service';
import { AuthUserGuard } from 'src/modules/auth-modules/auth/auth-user.guards';

@ApiTags('Event Participant')
@Controller('event-participant')
export class EventParticipantController {
  constructor(
    private readonly eventParticipantService: EventParticipantService,
    private readonly clickSignApiService: ClickSignApiService,
  ) {}

  @Patch('v1/event-participant/:eventSlug/increment-view-count')
  @ApiOperation({ summary: 'increment view count' })
  @ApiParam({ name: 'eventSlug', required: true, type: String })
  async eventAddViewCount(@Param('eventSlug') eventSlug: string) {
    return await this.eventParticipantService.eventAddViewCount(eventSlug);
  }

  @Get('v1/event-participant/network/:qrcode')
  @ApiParam({
    name: 'qrcode',
    required: true,
    type: String,
  })
  async networkParticipant(
    @Param('qrcode') qrcode: string,
  ): Promise<NetworkParticipantDto> {
    return await this.eventParticipantService.networkParticipant(qrcode);
  }

  @Get('v1/event-participant/find-all-events-public')
  @ApiOperation({ summary: 'Get all events public' })
  @ApiResponse({
    type: FindAllPublicEvents,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiQuery({
    name: 'page',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'perPage',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'searchable',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'initialDate',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'finalDate',
    required: false,
    type: String,
  })
  async findAllPublicEvents(
    @Query('page') page: string = '1',
    @Query('perPage') perPage: string = '10',
    @Query('searchable') searchable?: string,
    @Query('initialDate') initialDate?: string,
    @Query('finalDate') finalDate?: string,
  ): Promise<FindAllPublicEvents> {
    return await this.eventParticipantService.findAllPublicEvents(
      Number(page),
      Number(perPage),
      searchable,
      initialDate,
      finalDate,
    );
  }

  @Get('v1/event-participant/:slug/find-one-event-public')
  @ApiOperation({ summary: 'Get one event public' })
  @ApiResponse({
    type: FindOnePublicEventsDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'slug',
    type: String,
    required: true,
    description: 'Event slug',
  })
  async findOnePublicEvent(
    @Param('slug') slug: string,
  ): Promise<FindOnePublicEventsDto> {
    return await this.eventParticipantService.findOnePublicEvent(slug);
  }

  @Post('v1/event-participant/:eventTicketLinkId/create-participant')
  @ApiOperation({ summary: 'Create event' })
  @ApiCreatedResponse({
    description: 'event created',
    type: String,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiBody({
    type: EventParticipantCreateDto,
  })
  @ApiQuery({
    name: 'userEmail',
    required: true,
    type: String,
  })
  @ApiParam({
    name: 'eventTicketLinkId',
    required: true,
    type: String,
  })
  async createParticipant(
    @Body() body: EventParticipantCreateDto,
    @Query('userEmail') userEmail: string,
    @Param('eventTicketLinkId') eventTicketLinkId: string,
  ) {
    return await this.eventParticipantService.createParticipant(
      userEmail,
      eventTicketLinkId,
      body,
    );
  }

  @Post('v1/event-participant/:participantId/create-participant-facial')
  @ApiOperation({ summary: 'Create event participant facial' })
  @ApiCreatedResponse({
    description: 'event participant facial created',
    type: String,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'participantId',
    required: true,
    type: String,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async createParticipantFacial(
    @Param('participantId') participantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.eventParticipantService.createParticipantFacial(
      participantId,
      file,
    );
  }

  @Post('v1/event-participant/:participantId/create-participant-network')
  @ApiOperation({ summary: 'Create event participant network' })
  @ApiCreatedResponse({
    description: 'event participant network created',
    type: String,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'participantId',
    required: true,
    type: String,
  })
  @ApiBody({
    type: EventParticipantCreateNetworksDto,
  })
  async createParticipantNetworks(
    @Param('participantId') participantId: string,
    @Body() body: EventParticipantCreateNetworksDto,
  ) {
    return await this.eventParticipantService.createParticipantNetworks(
      participantId,
      body,
    );
  }

  @Get('v1/event-participant/:participantId/ticket')
  @ApiOperation({ summary: 'Get event participant ticket' })
  @ApiResponse({
    description: 'event participant ticket',
    type: ParticipantTicketDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'participantId',
    required: true,
    type: String,
  })
  async participantTicket(@Param('participantId') participantId: string) {
    return await this.eventParticipantService.participantTicket(participantId);
  }

  @Get('v1/event-participant/:eventTicketLinkId/event-info')
  @ApiOperation({ summary: 'Get event information' })
  @ApiResponse({
    type: FindEventInfoDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'eventTicketLinkId',
    required: true,
    type: String,
  })
  async findEventInfo(
    @Param('eventTicketLinkId') eventTicketLinkId: string,
  ): Promise<FindEventInfoDto> {
    return await this.eventParticipantService.findEventInfo(eventTicketLinkId);
  }

  @Get('v1/event-participant/list-tickets')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Get event information' })
  @ApiResponse({
    type: ListTickets,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiQuery({
    name: 'page',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'perPage',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'searchable',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'initialDate',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'finalDate',
    required: false,
    type: String,
  })
  async listTickets(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('perPage') perPage: string = '10',
    @Query('searchable') searchable?: string,
    @Query('initialDate') initialDate?: string,
    @Query('finalDate') finalDate?: string,
  ): Promise<ListTickets> {
    const userId = req.auth.user.id;
    return await this.eventParticipantService.listTickets(
      userId,
      Number(page),
      Number(perPage),
      searchable,
      initialDate,
      finalDate,
    );
  }

  @Get('v1/event-participant/:eventSlug/event-ticket-info')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Get event information' })
  @ApiResponse({
    type: EventTicketInfoDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'eventSlug',
    required: true,
    type: String,
  })
  async eventTicketInfo(
    @Request() req: any,
    @Param('eventSlug') eventSlug: string,
  ): Promise<EventTicketInfoDto> {
    const userId = req.auth.user.id;
    return await this.eventParticipantService.eventTicketInfo(
      userId,
      eventSlug,
    );
  }

  @Post('v1/event-participant/event-ticket-buy')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiBody({
    type: EventTicketSellDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async eventTicketSell(@Request() req: any, @Body() body: EventTicketSellDto) {
    const userId = req.auth.user.id;
    return await this.eventParticipantService.eventTicketSell(userId, body);
  }
}

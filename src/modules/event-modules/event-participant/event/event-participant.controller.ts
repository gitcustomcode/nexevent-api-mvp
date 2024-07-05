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
  FindAllPublicEventsDto,
  FindByEmailDto,
  FindEventInfoDto,
  FindOnePublicEventsDto,
  ListTickets,
  NetworkParticipantDto,
  ParticipantTicketDto,
  ThanksScreenDto,
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
    name: 'category',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'title',
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
    @Query('title') title?: string,
    @Query('category') category?: string,
    @Query('initialDate') initialDate?: string,
    @Query('finalDate') finalDate?: string,
  ): Promise<FindAllPublicEvents> {
    return await this.eventParticipantService.findAllPublicEvents(
      Number(page),
      Number(perPage),
      title,
      category,
      initialDate,
      finalDate,
    );
  }

  @Get('v1/event-participant/get-events-more-views')
  @ApiOperation({ summary: 'get Events More View' })
  @ApiResponse({
    type: FindAllPublicEventsDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getEventsMoreView(): Promise<FindAllPublicEventsDto> {
    return await this.eventParticipantService.getEventsMoreView();
  }

  @Get('v1/event-participant/get-events-home')
  @ApiOperation({ summary: 'get Events More View' })
  @ApiResponse({
    type: FindAllPublicEventsDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async findAllPublicEventsHome() {
    return await this.eventParticipantService.findAllPublicEventsHome();
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

  @Get('v1/event-participant/:partId/thanks-screen')
  @ApiOperation({ summary: 'Get one event public' })
  @ApiResponse({
    type: ThanksScreenDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'partId',
    type: String,
    required: true,
    description: 'Participant ID',
  })
  async thanksScreen(
    @Param('partId') partId: string,
  ): Promise<ThanksScreenDto> {
    return await this.eventParticipantService.thanksScreen(partId);
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
  @ApiQuery({
    name: 'updateUser',
    required: true,
    type: Boolean,
  })
  @ApiParam({
    name: 'eventTicketLinkId',
    required: true,
    type: String,
  })
  async createParticipant(
    @Body() body: EventParticipantCreateDto,
    @Query('userEmail') userEmail: string,
    @Query('updateUser') updateUser: boolean,
    @Param('eventTicketLinkId') eventTicketLinkId: string,
  ) {
    return await this.eventParticipantService.createParticipant(
      userEmail,
      eventTicketLinkId,
      body,
      updateUser,
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

  @Get('v1/event-participant/:email/find-user-by-email')
  @ApiOperation({ summary: 'Get event information' })
  @ApiResponse({
    type: FindByEmailDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'email',
    required: true,
    type: String,
  })
  async findByEmail(@Param('email') email: string): Promise<FindByEmailDto> {
    return await this.eventParticipantService.findByEmail(email);
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
  @ApiQuery({
    name: 'updateUser',
    required: true,
    type: Boolean,
  })
  async eventTicketSell(
    @Request() req: any,
    @Body() body: EventTicketSellDto,
    @Query('updateUser') updateUser: boolean = false,
  ) {
    const userId = req.auth.user.id;
    return await this.eventParticipantService.eventTicketSell(
      userId,
      body,
      updateUser,
    );
  }

  @Post('v1/event-participant/create-network')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiQuery({
    name: 'qrcode',
    required: true,
    type: String,
  })
  async createNetwork(@Request() req: any, @Query('qrcode') qrcode: string) {
    const userEmail = req.auth.user.email;
    return await this.eventParticipantService.createNetwork(userEmail, qrcode);
  }

  @Get('v1/event-participant/network-historic')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
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
  async networkHistoric(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('perPage') perPage: string = '10',
  ) {
    const userEmail = req.auth.user.email;
    return await this.eventParticipantService.networkHistoric(
      userEmail,
      Number(page),
      Number(perPage),
    );
  }
}

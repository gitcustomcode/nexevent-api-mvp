import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
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
} from './dto/event-participant-create.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  FindAllPublicEvents,
  FindEventInfoDto,
  FindOnePublicEventsDto,
  ParticipantTicketDto,
} from './dto/event-participant-response.dto';
import { ClickSignApiService } from 'src/services/click-sign.service';

@ApiTags('Event Participant')
@Controller('event-participant')
export class EventParticipantController {
  constructor(
    private readonly eventParticipantService: EventParticipantService,
    private readonly clickSignApiService: ClickSignApiService,
  ) {}

  @Get('v1/test/sobre/test')
  async test() {
    return await this.clickSignApiService.sendEmail(
      'd721ff19-e4fd-46da-9c84-633f4a805124',
    );
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
    name: 'title',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
  })
  async findAllPublicEvents(
    @Query('page') page: string = '1',
    @Query('perPage') perPage: string = '10',
    @Query('title') title?: string,
    @Query('category') category?: string,
  ): Promise<FindAllPublicEvents> {
    return await this.eventParticipantService.findAllPublicEvents(
      Number(page),
      Number(perPage),
      title,
      category,
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
}

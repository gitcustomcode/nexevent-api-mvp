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
  FindEventInfoDto,
  ParticipantTicketDto,
} from './dto/event-participant-response.dto';

@ApiTags('Event Participant')
@Controller('event-participant')
export class EventParticipantController {
  constructor(
    private readonly eventParticipantService: EventParticipantService,
  ) {}

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
  async test(
    @Param('eventTicketLinkId') eventTicketLinkId: string,
  ): Promise<FindEventInfoDto> {
    return await this.eventParticipantService.findEventInfo(eventTicketLinkId);
  }
}

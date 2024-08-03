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
import { EventProducerService } from './event-producer.service';
import { EventCreateDto } from './dto/event-producer-create.dto';
import { AuthUserGuard } from 'src/modules/auth-modules/auth/auth-user.guards';
import {
  EventAllResponseDto,
  EventDashboardPanelFinancialDto,
  EventDashboardResponseDto,
  EventPrintAllPartsDto,
  FindOneDashboardParticipantPanelDto,
  GeneralDashboardResponseDto,
  ResponseEventParticipants,
  ResponseEvents,
  getEventsPrintAutomatic,
} from './dto/event-producer-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  EventProducerUpdateDto,
  EventProducerUpgradeDto,
} from './dto/event-producer-update.dto';

@ApiTags('Event Producer')
@Controller('event-producer')
export class EventProducerController {
  constructor(private readonly eventProducerService: EventProducerService) {}

  @Get('v1/event-producer/:eventId/print-participant')
  @ApiOperation({ summary: 'Get event dashboard' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'eventId',
    type: String,
    required: true,
    description: 'Event id',
  })
  @ApiResponse({
    type: EventPrintAllPartsDto,
  })
  async getPartClient(
    @Param('eventId') eventId: string,
  ): Promise<EventPrintAllPartsDto> {
    return this.eventProducerService.getPartClient(eventId);
  }

  @Patch('v1/event-producer/:eventId/print-participant')
  @ApiOperation({ summary: 'Get event dashboard' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'eventId',
    type: String,
    required: true,
    description: 'Event Id',
  })
  @ApiQuery({
    name: 'participantId',
    type: String,
    required: true,
    description: 'Participant ID',
  })
  async updateIsPrint(
    @Param('eventId') eventId: string,
    @Query('participantId') participantId: string,
  ) {
    return this.eventProducerService.updateIsPrint(eventId, participantId);
  }

  @Get('v1/event-producer/get-events-print-automatic')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Get event dashboard' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiResponse({
    type: getEventsPrintAutomatic,
  })
  @ApiQuery({
    name: 'page',
    type: String,
    required: false,
    example: '1',
  })
  @ApiQuery({
    name: 'perPage',
    type: String,
    required: false,
    example: '10',
  })
  async getEventsPrintAutomatic(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('perPage') perPage: string = '10',
  ): Promise<getEventsPrintAutomatic> {
    const userId = req.auth.user.id;
    const newPage = Number(page) <= 0 ? 1 : Number(page);
    return this.eventProducerService.getEventsPrintAutomatic(
      userId,
      Number(newPage),
      Number(perPage),
    );
  }

  @Post('v1/event-producer/create-event')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Create event' })
  @ApiCreatedResponse({
    description: 'event created',
    type: String,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiBody({
    type: EventCreateDto,
  })
  async createEvent(@Body() body: EventCreateDto, @Request() req: any) {
    const email = req.auth.user.email;
    return this.eventProducerService.createEvent(email, body);
  }

  @Get('v1/event-producer/:slug/dashboard')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Get event dashboard' })
  @ApiResponse({
    description: 'event dashboard',
    type: EventDashboardResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'slug',
    type: String,
    required: true,
    description: 'Event slug',
  })
  async findOneDashboard(
    @Request() req: any,
    @Param('slug') slug: string,
  ): Promise<EventDashboardResponseDto> {
    const email = req.auth.user.email;
    return this.eventProducerService.findOneDashboard(email, slug);
  }

  @Get('v1/event-producer/:slug/dashboard/participant-panel')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Get event dashboard' })
  @ApiResponse({
    description: 'event dashboard',
    type: FindOneDashboardParticipantPanelDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'slug',
    type: String,
    required: true,
    description: 'Event slug',
  })
  async findOneDashboardParticipantPanel(
    @Request() req: any,
    @Param('slug') slug: string,
  ): Promise<FindOneDashboardParticipantPanelDto> {
    const email = req.auth.user.email;
    return this.eventProducerService.findOneDashboardParticipantPanel(
      email,
      slug,
    );
  }

  @Get('v1/event-producer/events/find-all')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Get all events' })
  @ApiResponse({
    description: 'find all events',
    type: EventAllResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiQuery({
    name: 'page',
    type: String,
    required: false,
    example: '1',
  })
  @ApiQuery({
    name: 'perPage',
    type: String,
    required: false,
    example: '10',
  })
  @ApiQuery({
    name: 'searchable',
    type: String,
    required: false,
    example: 'teste',
  })
  async findAllEvents(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('perPage') perPage: string = '10',
    @Query('searchable') searchable?: string,
  ): Promise<ResponseEvents> {
    const email = req.auth.user.email;
    const newPage = Number(page) <= 0 ? 1 : Number(page);
    return await this.eventProducerService.findAllEvents(
      email,
      Number(newPage),
      Number(perPage),
      searchable,
    );
  }

  @Post('v1/event-producer/:eventId/upload-photo')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Upload a event photo' })
  @ApiCreatedResponse({
    description: 'event photo created',
    type: String,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'eventId',
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
  async createEventPhoto(
    @Request() req: any,
    @Param('eventId') eventId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const email = req.auth.user.email;
    return await this.eventProducerService.updatePhotoEvent(
      email,
      eventId,
      file,
    );
  }

  @Post('v1/event-producer/:eventId/create-terms')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Upload a event photo' })
  @ApiCreatedResponse({
    description: 'event photo created',
    type: String,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'eventId',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'name',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'signature',
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
  async createEventTerms(
    @Request() req: any,
    @Param('eventId') eventId: string,
    @Query('name') name: string,
    @Query('signature') signature: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const email = req.auth.user.email;
    return await this.eventProducerService.createEventTerms(
      email,
      eventId,
      name,
      signature,
      file,
    );
  }

  @Get('v1/event-producer/general-dashboard')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Get general dashboard' })
  @ApiResponse({
    description: 'event dashboard',
    type: GeneralDashboardResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async generalDashboard(
    @Request() req: any,
  ): Promise<GeneralDashboardResponseDto> {
    const email = req.auth.user.email;
    return this.eventProducerService.generalDashboard(email);
  }

  @Get('v1/event-producer/:eventSlug/dashboard-financial')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Get general dashboard' })
  @ApiResponse({
    description: 'event dashboard',
    type: EventDashboardPanelFinancialDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'eventSlug',
    type: String,
    required: true,
    description: 'Event slug',
  })
  async financialDashboard(
    @Request() req: any,
    @Param('eventSlug') eventSlug: string,
  ): Promise<EventDashboardPanelFinancialDto> {
    const email = req.auth.user.email;
    return this.eventProducerService.financialDashboard(email, eventSlug);
  }

  @Get('v1/event-producer/:slug/participants/find-all')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Get general dashboard' })
  @ApiResponse({
    description: 'event dashboard',
    type: ResponseEventParticipants,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'slug',
    type: String,
    required: true,
    description: 'Event slug',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'perPage',
    type: Number,
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'name',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'ticketTitle',
    type: [String],
    required: false,
  })
  async findAllParticipants(
    @Request() req: any,
    @Param('slug') slug: string,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
    @Query('name') name?: string,
    @Query('ticketTitle') ticketTitle?: [],
  ): Promise<ResponseEventParticipants> {
    const email = req.auth.user.email;
    return this.eventProducerService.findAllParticipants(
      email,
      slug,
      page,
      perPage,
      name,
      ticketTitle,
    );
  }

  @Patch('v1/event-producer/:slug/update-event/')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Update event' })
  @ApiResponse({
    description: 'Update successful',
    type: String,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'slug',
    required: true,
    type: String,
  })
  @ApiBody({
    type: EventProducerUpdateDto,
  })
  async updateEvent(
    @Request() req: any,
    @Param('slug') slug: string,
    @Body() body: EventProducerUpdateDto,
  ): Promise<string> {
    const email = req.auth.user.email;
    return this.eventProducerService.updateEvent(email, slug, body);
  }
}

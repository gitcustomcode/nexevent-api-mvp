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
  EventDashboardResponseDto,
  GeneralDashboardResponseDto,
  ResponseEventParticipants,
  ResponseEvents,
} from './dto/event-producer-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Event Producer')
@Controller('event-producer')
export class EventProducerController {
  constructor(private readonly eventProducerService: EventProducerService) {}

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
    name: 'title',
    type: String,
    required: false,
    example: '10',
  })
  @ApiQuery({
    name: 'category',
    type: String,
    required: false,
    example: '10',
  })
  async findAllEvents(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('perPage') perPage: string = '10',
    @Query('title') title?: string,
    @Query('category') category?: string,
  ): Promise<ResponseEvents> {
    const email = req.auth.user.email;
    return await this.eventProducerService.findAllEvents(
      email,
      Number(page),
      Number(perPage),
      title,
      category,
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

  @Get('v1/event-producer/:slug/participans/find-all')
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
  async findAllParticipants(
    @Request() req: any,
    @Param('slug') slug: string,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
    @Query('name') name?: string,
  ): Promise<ResponseEventParticipants> {
    const email = req.auth.user.email;
    return this.eventProducerService.findAllParticipants(
      email,
      slug,
      page,
      perPage,
      name,
    );
  }

  @Patch('v1/event-producer/:eventId/payment/')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Payment event' })
  @ApiResponse({
    description: 'Payment successful',
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
    name: 'eventCostId',
    required: true,
    type: Number,
  })
  async paidEventCost(
    @Param('eventId') eventId: string,
    @Query('eventCostId') eventCostId: number,
  ): Promise<string> {
    return this.eventProducerService.paidEventCost(eventId, eventCostId);
  }
}

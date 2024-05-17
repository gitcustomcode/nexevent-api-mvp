import {
  Body,
  Controller,
  Get,
  Param,
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
import { EventDashboardResponseDto } from './dto/event-producer-response.dto';
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

  @Get('v1/event-producer/dashboard/:slug')
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
  async createParticipantFacial(
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
}

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EventProducerService } from './event-producer.service';
import { EventCreateDto } from './dto/event-producer-create.dto';
import { AuthUserGuard } from 'src/modules/auth-modules/auth/auth-user.guards';
import { EventAllResponseDto, EventDashboardResponseDto } from './dto/event-producer-response.dto';

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

  @Get('v1/event-producer/events')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Get all events' })
  @ApiResponse({
    description: 'find all events',
    type: EventAllResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async findAllEvents(
    @Request() req: any,
  ): Promise<EventAllResponseDto> {
    const email = req.auth.user.email;
    return this.eventProducerService.findAllEvents(email);
  }
}

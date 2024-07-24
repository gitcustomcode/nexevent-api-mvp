import {  Body,
  Controller,
  Delete,
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
import { EventProducerStaffService } from './event-producer-staff.service';
import { AuthUserGuard } from 'src/modules/auth-modules/auth/auth-user.guards';
import { EventProducerCreateStaffDto } from './dto/event-producer-create-staff.dto';
import {
  EventProducerRecommendedStaffs,
  EventStaffsResponse,
  ResponseStaffEvents,
} from './dto/event-producer-response-staff.dto';
import { ResponseEvents } from '../event/dto/event-producer-response.dto';

@ApiTags('Event Producer staff')
@Controller('event-producer')
export class EventProducerStaffController {
  constructor(
    private readonly eventProducerStaffService: EventProducerStaffService,
  ) {}

  @Post('v1/event-producer/:eventSlug/staff/create')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Create event staff' })
  @ApiCreatedResponse({
    description: 'event staff created',
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
    type: EventProducerCreateStaffDto,
  })
  async createStaff(
    @Request() req: any,
    @Body() body: EventProducerCreateStaffDto,
    @Param('eventSlug') eventSlug: string,
  ) {
    const email = req.auth.user.email;
    return await this.eventProducerStaffService.createStaff(
      email,
      eventSlug,
      body,
    );
  }

  @Get('v1/event-producer/:eventSlug/staff/list')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'List event staff' })
  @ApiResponse({
    description: 'event staff list',
    type: EventStaffsResponse,
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
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'perPage',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'staffEmail',
    required: false,
    type: String,
  })
  async listEventStaff(
    @Request() req: any,
    @Param('eventSlug') eventSlug: string,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
    @Query('staffEmail') staffEmail?: string,
  ): Promise<EventStaffsResponse> {
    const email = req.auth.user.email;
    return await this.eventProducerStaffService.listEventStaff(
      email,
      eventSlug,
      page,
      perPage,
      staffEmail,
    );
  }

  @Get('v1/event-producer/staff/get-events')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Retrieve events that the user is staff' })
  @ApiResponse({
    type: ResponseStaffEvents,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'perPage',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'searchable',
    required: false,
    type: String,
  })
  async staffEvents(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
    @Query('searchable') searchable?: string,
  ): Promise<ResponseStaffEvents> {
    const userId = req.auth.user.id;
    return await this.eventProducerStaffService.staffEvents(
      userId,
      page,
      perPage,
      searchable,
    );
  }

  @Get('v1/event-producer/recommend-staffs')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'List event staff' })
  @ApiResponse({
    description: 'event staff list',
    type: EventProducerRecommendedStaffs,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'perPage',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'staffName',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'staffEmail',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'eventTitle',
    required: false,
    type: String,
  })
  async recommendStaffs(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
    @Query('staffName') staffName?: string,
    @Query('staffEmail') staffEmail?: string,
    @Query('eventTitle') eventTitle?: string,
  ): Promise<EventProducerRecommendedStaffs> {
    const userId = req.auth.user.id;
    return await this.eventProducerStaffService.recommendStaffs(
      userId,
      page,
      perPage,
      staffName,
      staffEmail,
      eventTitle,
    );
  }

  @Patch('v1/event-producer/:eventSlug/staff/invite')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Update event staff' })
  @ApiResponse({
    description: 'event staff updated',
    type: String,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'eventSlug',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'acceptedInvite',
    required: false,
    type: Boolean,
  })
  async updateEventStaff(
    @Request() req: any,
    @Param('eventSlug') eventSlug: string,
    @Query('acceptedInvite') acceptedInvite: boolean,
  ) {
    const userId = req.auth.user.id;
    return await this.eventProducerStaffService.updateEventStaff(
      userId,
      eventSlug,
      acceptedInvite,
    );
  }

  @Post('v1/event-producer/staff/resend-invite-email/:staffId')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Resend invite email to staff' })
  @ApiCreatedResponse({
    description: 'Resend invite email to staff',
    type: String,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'staffId',
    required: true,
    type: String,
  })
  async resendInviteEmail(
    @Request() req: any,
    @Param('staffId') staffId: string,
  ): Promise<String> {
    const email = req.auth.user.email;
    return await this.eventProducerStaffService.resendInviteEmail(
      email,
      staffId
    );
  }

  @Delete('v1/event-producer/:eventSlug/staff/delete/:staffId')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Delete event staff' })
  @ApiResponse({
    description: 'event staff deleted',
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
    name: 'staffId',
    required: true,
    type: String,
  })
  async delete(
    @Request() req: any,
    @Param('eventSlug') eventSlug: string,
    @Param('staffId') staffId: string,
  ) {
    const email = req.auth.user.email;
    return await this.eventProducerStaffService.deleteEventStaff(
      email,
      eventSlug,
      staffId,
    );
  }
}

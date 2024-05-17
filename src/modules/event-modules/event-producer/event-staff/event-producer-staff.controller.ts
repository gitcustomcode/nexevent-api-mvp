import {
  Body,
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
import { EventStaffsResponse } from './dto/event-producer-response-staff.dto';

@ApiTags('Event Producer')
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
  async listEventStaff(
    @Request() req: any,
    @Param('eventSlug') eventSlug: string,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
  ): Promise<EventStaffsResponse> {
    const email = req.auth.user.email;
    return await this.eventProducerStaffService.listEventStaff(
      email,
      eventSlug,
      page,
      perPage,
    );
  }

  @Patch('v1/event-producer/:eventSlug/staff/update/:staffId')
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
  @ApiParam({
    name: 'staffId',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'staffEmail',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'staffPassword',
    required: false,
    type: String,
  })
  async updateEventStaff(
    @Request() req: any,
    @Param('eventSlug') eventSlug: string,
    @Param('staffId') staffId: string,
    @Query('staffEmail') staffEmail: string,
    @Query('staffPassword') staffPassword: string,
  ) {
    const email = req.auth.user.email;
    return await this.eventProducerStaffService.updateEventStaff(
      email,
      eventSlug,
      staffId,
      staffEmail,
      staffPassword,
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

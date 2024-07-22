import {  Body,
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
import { EventTicketProducerService } from './event-ticket-producer.service';
import { AuthUserGuard } from 'src/modules/auth-modules/auth/auth-user.guards';
import {
  EventTicketCouponsDto,
  EventTicketCreateDto,
} from './dto/event-ticket-producer-create.dto';
import { EventTicketUpdateDto } from './dto/event-ticket-producer-update.dto';
import {
  EventTicketCouponDashboardDto,
  EventTicketCouponsResponse,
  EventTicketLinkByEmailResponse,
  EventTicketLinkCreateResponseDto,
  EventTicketLinkResponse,
  EventTicketsResponse,
} from './dto/event-ticket-producer-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Event Producer Tickets')
@Controller('event-producer')
export class EventTicketProducerController {
  constructor(
    private readonly eventTicketProducerService: EventTicketProducerService,
  ) {}

  @Post('v1/event-producer/:eventSlug/create-ticket')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Create event ticket' })
  @ApiCreatedResponse({
    description: 'event ticket created',
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
    type: EventTicketCreateDto,
  })
  async createEventTicket(
    @Param('eventSlug') eventSlug: string,
    @Body() body: EventTicketCreateDto,
    @Request() req: any,
  ) {
    const email = req.auth.user.email;
    return this.eventTicketProducerService.createEventTicket(
      email,
      eventSlug,
      body,
    );
  }

  @Post('v1/event-producer/:eventSlug/create-cupom')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Create event ticket cupom' })
  @ApiCreatedResponse({
    description: 'event ticket created',
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
    type: EventTicketCouponsDto,
  })
  async createEventTicketCoupons(
    @Param('eventSlug') eventSlug: string,
    @Body() body: EventTicketCouponsDto,
    @Request() req: any,
  ) {
    const email = req.auth.user.email;
    return this.eventTicketProducerService.createEventTicketCoupons(
      email,
      eventSlug,
      body,
    );
  }

  @Patch('v1/event-producer/:eventSlug/update-ticket/:eventTicketId')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Update event ticket' })
  @ApiResponse({
    description: 'event ticket updated',
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
    name: 'eventTicketId',
    required: true,
    type: String,
  })
  @ApiBody({
    type: EventTicketUpdateDto,
  })
  async updateEventTicket(
    @Param('eventSlug') eventSlug: string,
    @Param('eventTicketId') eventTicketId: string,
    @Body() body: EventTicketUpdateDto,
    @Request() req: any,
  ) {
    const email = req.auth.user.email;
    return this.eventTicketProducerService.updateEventTicket(
      email,
      eventSlug,
      eventTicketId,
      body,
    );
  }

  @Get('v1/event-producer/:eventSlug/get-tickets/')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Get event tickets' })
  @ApiResponse({
    description: 'event tickets',
    type: EventTicketsResponse,
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
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'perPage',
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'title',
    required: false,
    type: String,
  })
  async findAllEventTicket(
    @Param('eventSlug') eventSlug: string,
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
    @Query('title') title?: string,
  ): Promise<EventTicketsResponse> {
    const email = req.auth.user.email;
    return this.eventTicketProducerService.findAllEventTicket(
      email,
      eventSlug,
      page,
      perPage,
      title,
    );
  }

  @Get('v1/event-producer/:eventSlug/get-cupons/')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Get event cupons' })
  @ApiResponse({
    description: 'event cupons',
    type: EventTicketCouponsResponse,
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
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'perPage',
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'title',
    required: false,
    type: String,
  })
  async findAllEventTicketCoupons(
    @Param('eventSlug') eventSlug: string,
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
    @Query('title') title?: string,
  ): Promise<EventTicketCouponsResponse> {
    const email = req.auth.user.email;
    return this.eventTicketProducerService.findAllEventTicketCoupons(
      email,
      eventSlug,
      page,
      perPage,
      title,
    );
  }

  @Get('v1/event-producer/:eventSlug/dashboard-cupons/')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Get event cupons dash' })
  @ApiResponse({
    description: 'event cupons dash',
    type: EventTicketCouponDashboardDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'eventSlug',
    required: true,
    type: String,
  })
  async cuponsDashboard(
    @Param('eventSlug') eventSlug: string,
    @Request() req: any,
  ): Promise<EventTicketCouponDashboardDto> {
    const email = req.auth.user.email;
    return this.eventTicketProducerService.cuponsDashboard(email, eventSlug);
  }

  @Get('v1/event-producer/:eventSlug/tickets/:ticketId/:ticketPriceId/links')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Get all links with one ticket' })
  @ApiResponse({
    status: 200,
    description: 'Links retrieved successfully',
    type: EventTicketLinkResponse,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'eventSlug',
    required: true,
    type: String,
  })
  @ApiParam({
    name: 'ticketId',
    required: true,
    type: String,
  })
  @ApiParam({
    name: 'ticketPriceId',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'page',
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'perPage',
    required: true,
    type: Number,
  })
  async getAllLinksWithOneTicket(
    @Request() req: any,
    @Param('eventSlug') eventSlug: string,
    @Param('ticketId') ticketId: string,
    @Param('ticketPriceId') ticketPriceId: string,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
  ): Promise<EventTicketLinkResponse> {
    const userEmail = req.auth.user.email;
    return this.eventTicketProducerService.getAllLinksWithOneTicket(
      userEmail,
      eventSlug,
      ticketId,
      ticketPriceId,
      Number(page),
      Number(perPage),
    );
  }

@Post('v1/event-producer/:eventSlug/send-invite-link-by-email/:ticketBatchId')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Send invite link participant by email' })
  @ApiCreatedResponse({
    description: 'invite link sent',
    type: EventTicketLinkByEmailResponse,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'eventSlug',
    required: true,
    type: String,
  })
  @ApiParam({
    name: 'ticketBatchId',
    required: true,
    type: String,
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
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
  async sendInviteLinkByEmail(
    @Param('eventSlug') eventSlug: string,
    @Param('ticketBatchId') ticketBatchId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ): Promise<EventTicketLinkByEmailResponse> {
    const userEmail = req.auth.user.email;
    return this.eventTicketProducerService.sendInviteLinkByEmail(
      userEmail,
      eventSlug,
      ticketBatchId,
      file
    );
  }

  @Post('v1/event-producer/:eventSlug/create-private-link/:ticketBatchId')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Create invite link by private ticket' })
  @ApiCreatedResponse({
    description: 'Invite private link created',
    type: EventTicketLinkCreateResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'eventSlug',
    required: true,
    type: String,
  })
  @ApiParam({
    name: 'ticketBatchId',
    required: true,
    type: String,
  })
  async createPrivateTicketLink(
    @Param('eventSlug') eventSlug: string,
    @Param('ticketBatchId') ticketBatchId: string,
    @Request() req: any,
  ): Promise<EventTicketLinkCreateResponseDto> {
    const userEmail = req.auth.user.email;
    return this.eventTicketProducerService.createPrivateTicketLink(
      userEmail,
      eventSlug,
      ticketBatchId
    );
  }

}

import {
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
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EventProducerAccreditationService } from './event-producer-accreditation.service';
import { AuthUserGuard } from 'src/modules/auth-modules/auth/auth-user.guards';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  GetEventConfigDto,
  LastAccreditedParticipantsResponse,
} from './dto/event-producer-accreditation-response.dto';

@ApiTags('Event Producer credential')
@Controller('event-producer')
export class EventProducerAccreditationController {
  constructor(
    private readonly eventProducerAccreditationService: EventProducerAccreditationService,
  ) {}

  @Get('v1/event-producer/:eventSlug/accreditation/qrcode')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Get event accreditation qrcode' })
  @ApiResponse({
    description: 'event accreditation qrcode',
    type: String,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'eventSlug',
    type: String,
    required: true,
    description: 'Event slug',
  })
  @ApiQuery({
    name: 'qrcode',
    type: String,
    required: true,
    description: 'Event accreditation qrcode',
  })
  async findByQrCode(
    @Param('eventSlug') eventSlug: string,
    @Query('qrcode') qrcode: string,
    @Request() req: any,
  ) {
    const email = req.auth.user.email;
    return this.eventProducerAccreditationService.findByQrCode(
      email,
      eventSlug,
      qrcode,
    );
  }

  @Post('v1/event-producer/:eventSlug/accreditation/facial')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Get event accreditation qrcode' })
  @ApiResponse({
    description: 'event accreditation qrcode',
    type: String,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'eventSlug',
    type: String,
    required: true,
    description: 'Event slug',
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
  async findByFacial(
    @Param('eventSlug') eventSlug: string,
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const email = req.auth.user.email;
    return this.eventProducerAccreditationService.findByFacial(
      email,
      eventSlug,
      file,
    );
  }

  @Post('v1/event-producer/:eventSlug/accreditation/accredit')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Accredit a participant' })
  @ApiResponse({
    description: 'event accreditation qrcode',
    type: String,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'eventSlug',
    type: String,
    required: true,
    description: 'Event slug',
  })
  @ApiQuery({
    name: 'participantId',
    type: String,
    required: true,
    description: 'Event Participant ID',
  })
  async accreditParticipant(
    @Param('eventSlug') eventSlug: string,
    @Query('participantId') participantId: string,
    @Request() req: any,
  ) {
    const email = req.auth.user.email;
    return this.eventProducerAccreditationService.accreditParticipant(
      email,
      eventSlug,
      participantId,
    );
  }

  @Get('v1/event-producer/:eventSlug/accreditation/historic-participants')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Get accreditation historic' })
  @ApiResponse({
    type: LastAccreditedParticipantsResponse,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'eventSlug',
    type: String,
    required: true,
    description: 'Event slug',
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
  async lastAccreditedParticipants(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('perPage') perPage: string = '10',
    @Param('eventSlug') eventSlug: string,
  ): Promise<LastAccreditedParticipantsResponse> {
    const email = req.auth.user.email;
    return await this.eventProducerAccreditationService.lastAccreditedParticipants(
      eventSlug,
      email,
      Number(page),
      Number(perPage),
    );
  }

  @Get('v1/event-producer/:eventSlug/accreditation/event-config')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Get event config' })
  @ApiResponse({
    type: GetEventConfigDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'eventSlug',
    type: String,
    required: true,
    description: 'Event slug',
  })
  async getEventConfig(
    @Request() req: any,
    @Param('eventSlug') eventSlug: string,
  ): Promise<GetEventConfigDto> {
    const email = req.auth.user.email;
    return await this.eventProducerAccreditationService.getEventConfig(
      eventSlug,
      email,
    );
  }

  @Patch('v1/event-producer/:eventSlug/accreditation/re-printer')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Get event config' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'eventSlug',
    type: String,
    required: true,
    description: 'Event slug',
  })
  @ApiQuery({
    name: 'participantId',
    type: String,
    required: true,
    description: 'Event participant id',
  })
  async rePrintParticipant(
    @Request() req: any,
    @Param('eventSlug') eventSlug: string,
    @Query('participantId') participantId: string,
  ) {
    const email = req.auth.user.email;
    return await this.eventProducerAccreditationService.rePrintParticipant(
      email,
      eventSlug,
      participantId,
    );
  }

  @Get('v1/event-producer/:eventSlug/accreditation/check-out-all-participants')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Get event accreditation qrcode' })
  @ApiResponse({
    description: 'event accreditation qrcode',
    type: String,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'eventSlug',
    type: String,
    required: true,
    description: 'Event slug',
  })
  async checkOutInAllParticipants(
    @Param('eventSlug') eventSlug: string,
    @Request() req: any,
  ) {
    const email = req.auth.user.email;
    return this.eventProducerAccreditationService.checkOutInAllParticipants(
      email,
      eventSlug,
    );
  }
}

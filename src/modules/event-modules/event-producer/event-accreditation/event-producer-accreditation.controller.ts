import {
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
}

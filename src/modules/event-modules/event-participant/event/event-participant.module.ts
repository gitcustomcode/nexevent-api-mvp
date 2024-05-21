import { Module } from '@nestjs/common';
import { EventParticipantController } from './event-participant.controller';
import { EventParticipantService } from './event-participant.service';
import { PrismaService } from 'src/services/prisma.service';
import { UserParticipantValidationService } from 'src/services/user-participant-validation.service';
import { StorageService } from 'src/services/storage.service';
import { ConfigService } from 'aws-sdk';
import { ConfigModule } from '@nestjs/config';
import variables from 'src/variables';
import { EmailService } from 'src/services/email.service';
import { ClickSignApiService } from 'src/services/click-sign.service';
import { PaginationService } from 'src/services/paginate.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [variables],
    }),
  ],
  controllers: [EventParticipantController],
  providers: [
    EventParticipantService,
    PrismaService,
    UserParticipantValidationService,
    StorageService,
    EmailService,
    ClickSignApiService,
    PaginationService,
  ],
})
export class EventParticipantModule {}

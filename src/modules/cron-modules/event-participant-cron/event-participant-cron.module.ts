import { Module } from '@nestjs/common';
import { EventParticipantCronService } from './event-participant-cron.service';
import { PrismaService } from 'src/services/prisma.service';
import { EmailService } from 'src/services/email.service';
import { ConfigModule } from '@nestjs/config';
import variables from 'src/variables';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [variables],
    }),
  ],
  providers: [EventParticipantCronService, PrismaService, EmailService],
})
export class EventParticipantCronModule {}

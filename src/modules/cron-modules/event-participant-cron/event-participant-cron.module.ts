import { Module } from '@nestjs/common';
import { EventParticipantCronService } from './event-participant-cron.service';
import { PrismaService } from 'src/services/prisma.service';

@Module({
  providers: [EventParticipantCronService, PrismaService],
})
export class EventParticipantCronModule {}

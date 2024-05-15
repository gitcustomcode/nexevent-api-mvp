import { Module } from '@nestjs/common';
import { EventProducerController } from './event-producer.controller';
import { EventProducerService } from './event-producer.service';
import { PrismaService } from 'src/services/prisma.service';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';

@Module({
  controllers: [EventProducerController],
  providers: [
    EventProducerService,
    PrismaService,
    UserProducerValidationService,
  ],
})
export class EventProducerModule {}

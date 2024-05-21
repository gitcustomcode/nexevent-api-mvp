import { Module } from '@nestjs/common';
import { EventProducerController } from './event-producer.controller';
import { EventProducerService } from './event-producer.service';
import { PrismaService } from 'src/services/prisma.service';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';
import { StorageService } from 'src/services/storage.service';
import { ConfigModule } from '@nestjs/config';
import variables from 'src/variables';
import { PaginationService } from 'src/services/paginate.service';
import { EventTicketProducerService } from '../event-ticket/event-ticket-producer.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [variables],
    }),
  ],
  controllers: [EventProducerController],
  providers: [
    EventProducerService,
    PrismaService,
    UserProducerValidationService,
    StorageService,
    PaginationService,
    EventTicketProducerService,
  ],
})
export class EventProducerModule {}

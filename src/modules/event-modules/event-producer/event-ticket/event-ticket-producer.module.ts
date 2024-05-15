import { Module } from '@nestjs/common';
import { EventTicketProducerService } from './event-ticket-producer.service';
import { EventTicketProducerController } from './event-ticket-producer.controller';
import { PrismaService } from 'src/services/prisma.service';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';
import { PaginationService } from 'src/services/paginate.service';

@Module({
  providers: [
    EventTicketProducerService,
    PrismaService,
    UserProducerValidationService,
    PaginationService,
  ],
  controllers: [EventTicketProducerController],
})
export class EventTicketProducerModule {}

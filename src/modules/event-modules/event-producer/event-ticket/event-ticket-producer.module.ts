import { Module } from '@nestjs/common';
import { EventTicketProducerService } from './event-ticket-producer.service';
import { EventTicketProducerController } from './event-ticket-producer.controller';
import { PrismaService } from 'src/services/prisma.service';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';
import { PaginationService } from 'src/services/paginate.service';
import { StripeService } from 'src/services/stripe.service';

@Module({
  providers: [
    EventTicketProducerService,
    PrismaService,
    UserProducerValidationService,
    PaginationService,
    StripeService,
  ],
  controllers: [EventTicketProducerController],
})
export class EventTicketProducerModule {}

import { Module } from '@nestjs/common';
import { EventTicketProducerService } from './event-ticket-producer.service';
import { EventTicketProducerController } from './event-ticket-producer.controller';
import { PrismaService } from 'src/services/prisma.service';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';
import { PaginationService } from 'src/services/paginate.service';
import { StripeService } from 'src/services/stripe.service';
import { EmailService } from 'src/services/email.service';
import { ConfigModule } from '@nestjs/config';
import variables from 'src/variables';

@Module({
  controllers: [EventTicketProducerController],
  providers: [
    EmailService,
    EventTicketProducerService,
    PrismaService,
    UserProducerValidationService,
    PaginationService,
    StripeService,
  ],
  
})
export class EventTicketProducerModule {}

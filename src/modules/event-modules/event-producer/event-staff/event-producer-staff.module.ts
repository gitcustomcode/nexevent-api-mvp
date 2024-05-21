import { Module } from '@nestjs/common';
import { EventProducerStaffController } from './event-producer-staff.controller';
import { PaginationService } from 'src/services/paginate.service';
import { EventProducerStaffService } from './event-producer-staff.service';
import { PrismaService } from 'src/services/prisma.service';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';
import { EmailService } from 'src/services/email.service';
import { ConfigModule } from '@nestjs/config';
import variables from 'src/variables';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [variables],
    }),
  ],
  controllers: [EventProducerStaffController],
  providers: [
    EventProducerStaffService,
    PrismaService,
    UserProducerValidationService,
    PaginationService,
    EmailService,
  ],
})
export class EventProducerStaffModule {}

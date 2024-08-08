import { Module } from '@nestjs/common';import { EventProducerAccreditationController } from './event-producer-accreditation.controller';
import { PrismaService } from 'src/services/prisma.service';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';
import { EventProducerAccreditationService } from './event-producer-accreditation.service';
import { StorageService } from 'src/services/storage.service';
import { ConfigModule } from '@nestjs/config';
import variables from 'src/variables';
import { PaginationService } from 'src/services/paginate.service';
import { AppGateway } from 'src/gateway/gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [variables],
    }),
  ],
  controllers: [EventProducerAccreditationController],
  providers: [
    EventProducerAccreditationService,
    PrismaService,
    StorageService,
    UserProducerValidationService,
    PaginationService,
    AppGateway,
  ],
})
export class EventProducerAccreditationModule {}

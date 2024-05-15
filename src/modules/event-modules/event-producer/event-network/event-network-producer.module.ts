import { Module } from '@nestjs/common';
import { PaginationService } from 'src/services/paginate.service';
import { PrismaService } from 'src/services/prisma.service';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';
import { EventNetworksProducerService } from './event-network-producer.service';
import { EventNetworkProducerController } from './event-network-producer.controller';

@Module({
  providers: [
    EventNetworksProducerService,
    PrismaService,
    UserProducerValidationService,
    PaginationService,
  ],
  controllers: [EventNetworkProducerController],
})
export class EventNetworkProducerModule {}

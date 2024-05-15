import { Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { AuthModule } from './modules/auth-modules/auth/auth.module';
import { UserProducerModule } from './modules/user-modules/user-producer/user-producer.module';
import { EventProducerModule } from './modules/event-modules/event-producer/event/event-producer.module';
import { EventTicketProducerModule } from './modules/event-modules/event-producer/event-ticket/event-ticket-producer.module';
import { EventNetworkProducerModule } from './modules/event-modules/event-producer/event-network/event-network-producer.module';
import { EventParticipantModule } from './modules/event-modules/event-participant/event/event-participant.module';
import { ConfigService } from 'aws-sdk';

@Module({
  imports: [
    AuthModule,
    UserProducerModule,
    EventProducerModule,
    EventTicketProducerModule,
    EventNetworkProducerModule,
    EventParticipantModule,
  ],
  controllers: [],
  providers: [
    PrismaService,
    ConfigService,
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { UserProducerController } from './user-producer.controller';
import { UserProducerService } from './user-producer.service';
import { PrismaService } from 'src/services/prisma.service';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';
import { AuthService } from 'src/modules/auth-modules/auth/auth.service';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [UserProducerController],
  providers: [
    UserProducerService,
    PrismaService,
    UserProducerValidationService,
    AuthService,
    ConfigService,
  ],
})
export class UserProducerModule {}

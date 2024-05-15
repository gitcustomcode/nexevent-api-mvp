import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import variables from 'src/variables';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';
import { PrismaService } from 'src/services/prisma.service';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
    }),
    ConfigModule.forRoot({
      load: [variables],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserProducerValidationService,
    JwtService,
    PrismaService,
  ],
})
export class AuthModule {}

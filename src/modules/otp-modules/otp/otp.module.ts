import { Module } from '@nestjs/common';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { EmailService } from 'src/services/email.service';
import { CryptoPassword } from 'src/services/crypto.service';
import { AuthService } from 'src/modules/auth-modules/auth/auth.service';
import { PrismaService } from 'src/services/prisma.service';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';
import { ConfigModule } from '@nestjs/config';
import variables from 'src/variables';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [variables],
    }),
  ],
  controllers: [OtpController],
  providers: [
    OtpService,
    EmailService,
    CryptoPassword,
    AuthService,
    PrismaService,
    UserProducerValidationService,
  ],
})
export class OtpModule {}

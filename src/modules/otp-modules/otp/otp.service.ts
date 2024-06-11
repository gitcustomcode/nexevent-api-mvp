import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { genSaltSync, hashSync } from 'bcrypt';
import { AuthService } from 'src/modules/auth-modules/auth/auth.service';
import { CryptoPassword } from 'src/services/crypto.service';
import { EmailService } from 'src/services/email.service';
import { PrismaService } from 'src/services/prisma.service';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';
import { createDateExpiration } from 'src/utils/createDateExpiration';
import { otpCodeGenerate } from 'src/utils/otpCodeGenerate';

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly cryptoPassword: CryptoPassword,
    private readonly authService: AuthService,
    private readonly userProducerValidationService: UserProducerValidationService,
  ) {}

  async forgotPassword(email: string): Promise<string> {
    try {
      const user =
        await this.userProducerValidationService.findUserByEmail(email.toLowerCase());

      if (!user) {
        throw new NotFoundException('User not found');
      }

      await this.updateVerified(user.id);

      const otpCod = otpCodeGenerate();

      const now = new Date();
      const timeExpire = createDateExpiration(now);

      const OTPData = await this.prisma.otp.create({
        data: {
          userId: user.id,
          type: 'RECOVERY',
          number: otpCod,
          dateExpiration: timeExpire,
        },
      });

      if (!OTPData) {
        throw new InternalServerErrorException('Error create otp');
      }

      const data = {
        to: email.toLowerCase(),
        name: user.name,
        type: 'forgotPassword',
        code: otpCod.toString(),
      };

      await this.emailService.sendEmail(data);

      const details = {
        dateExpire: timeExpire,
        userId: OTPData.userId,
        type: OTPData.type,
        otpId: OTPData.id,
        userEmail: user.email.toLowerCase(),
      };

      const encoded = await this.cryptoPassword.encode(JSON.stringify(details));

      return encoded;
    } catch (error) {
      throw error;
    }
  }

  async validateOtp(hash: string, number: string): Promise<string> {
    try {
      const decoded = await this.cryptoPassword.decode(hash);

      const result = await this.findOTP(
        decoded.otpId,
        decoded.userId,
        Number(number),
        decoded.dateExpire,
      );

      const now = new Date();

      if (result.dateExpiration <= now) {
        throw new ConflictException(`Code expired`);
      }

      if (result.verified == true) {
        throw new ConflictException(`Code already used`);
      }

      const details = {
        dateExpire: result.dateExpiration,
        userId: result.userId,
        otpId: result.id,
        type: result.type,
        number: result.number,
        userEmail: decoded.userEmail.toLowerCase(),
      };

      const encoded = await this.cryptoPassword.encode(JSON.stringify(details));

      return encoded;
    } catch (error) {
      throw error;
    }
  }

  async changePassword(
    hash: string,
    number: string,
    password: string,
  ): Promise<string> {
    try {
      const decoded = await this.cryptoPassword.decode(hash);

      if (number != decoded.number) {
        throw new ConflictException(`Code different from expected`);
      }

      const user = await this.userProducerValidationService.findUserByEmail(
        decoded.userEmail.toLowerCase(),
      );

      if (!user) {
        throw new NotFoundException('User not found');
      }

      await this.findOTP(
        decoded.otpId,
        decoded.userId,
        Number(number),
        decoded.dateExpire,
        decoded.type,
      );

      const salt = genSaltSync(10);
      const hashedPassword = hashSync(password, salt);

      const userUpdated = await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      await this.prisma.otp.update({
        where: { id: decoded.otpId },
        data: { verified: true },
      });

      return await this.authService.login(userUpdated.email.toLowerCase(), password);
    } catch (error) {
      throw error;
    }
  }

  private async findOTP(
    id: string,
    userId: string,
    number: number,
    dateExpire: Date,
    type?: string,
  ) {
    const where: Prisma.OtpWhereUniqueInput = {
      id: id,
      number: number,
      userId: userId,
      dateExpiration: dateExpire,
    };

    if (type) {
      where.type = type === 'RECOVERY' ? 'RECOVERY' : 'TWO_AUTH';
    }

    const result = await this.prisma.otp.findUnique({
      where,
    });

    return result;
  }

  private async findUserOTP(userId: string) {
    const result = await this.prisma.otp.findMany({
      where: { userId: userId },
    });

    return result;
  }

  private async updateVerified(userId: string) {
    const otpRecords = await this.findUserOTP(userId);

    if (otpRecords.length === 0) {
      return;
    }

    const otpIds = otpRecords.map((otp) => otp.id);

    await this.prisma.otp.updateMany({
      where: { id: { in: otpIds } },
      data: { verified: true },
    });
  }
}

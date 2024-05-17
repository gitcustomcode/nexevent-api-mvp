import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/services/prisma.service';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly userProducerValidationService: UserProducerValidationService,
  ) {
    this.jwtSecret = this.configService.get<string>('app.jwtSecret');
  }

  async login(email: string, password: string): Promise<string> {
    try {
      const user =
        await this.userProducerValidationService.validateUserProducerByEmail(
          email,
          password,
        );

      const haveOtp = await this.prisma.otp.findFirst({
        where: {
          userId: user.id,
          verified: false,
        },
      });

      if (haveOtp) {
        throw new ConflictException(
          'You need to complete the password change process to log in',
        );
      }

      const payload = { user: user };

      const accessToken = this.jwtService.signAsync(payload, {
        secret: this.jwtSecret,
      });

      return accessToken;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new UnauthorizedException(error);
    }
  }
}

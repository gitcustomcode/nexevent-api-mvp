import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userProducerValidationService: UserProducerValidationService,
  ) {
    this.jwtSecret = this.configService.get<string>('app.jwtSecret');
  }

  async login(email: string, password: string): Promise<String> {
    try {
      const user =
        await this.userProducerValidationService.validateUserProducerByEmail(
          email,
          password,
        );

      const payload = { user: user };

      const accessToken = this.jwtService.signAsync(payload, {
        secret: this.jwtSecret,
      });

      return accessToken;
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }
}

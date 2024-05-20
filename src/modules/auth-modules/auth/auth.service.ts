import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compareSync } from 'bcrypt';
import { PrismaService } from 'src/services/prisma.service';
import {
  StorageService,
  StorageServiceType,
} from 'src/services/storage.service';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
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

  async staffLogin(
    eventSlug: string,
    email: string,
    password: string,
  ): Promise<string> {
    try {
      const eventExists = await this.prisma.event.findUnique({
        where: {
          slug: eventSlug,
        },
      });

      if (!eventExists) {
        throw new NotFoundException('Event not found');
      }

      const staff = await this.prisma.eventStaff.findFirst({
        where: {
          email: email,
          eventId: eventExists.id,
        },
      });

      const passwordValid = compareSync(password, staff.password);

      if (!passwordValid) {
        throw new UnauthorizedException('Invalid password');
      }

      delete staff.password;

      const payload = { user: staff };

      const accessToken = this.jwtService.signAsync(payload, {
        secret: this.jwtSecret,
      });

      return accessToken;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error);
    }
  }

  async validateWithFacial(userPhoto: Express.Multer.File) {
    try {
      const usersFacials = await this.prisma.userFacial.findMany({
        include: {
          user: true,
        },
      });

      const validationPromises = usersFacials.map(async (user) => {
        const photo = await this.storageService.getFile(
          StorageServiceType.S3,
          user.path,
        );

        if (!userPhoto.buffer || !photo) {
          console.error(
            'Uma das imagens está vazia ou não foi carregada corretamente.',
          );
          return false;
        }

        try {
          const valid = await this.storageService.validateFacial(
            userPhoto.buffer,
            photo,
          );

          if (valid !== false && valid > 95) {
            return user.user.email;
          } else {
            return false;
          }
        } catch (err) {
          console.error(
            `Erro ao validar facial para o usuário ${user.userId}:`,
            err.message,
          );
          return false;
        }
      });

      const results = await Promise.all(validationPromises);

      // Filtrar resultados válidos
      const validResults = results.filter((result) => result !== false);

      return validResults;
    } catch (error) {
      console.error('Erro no login facial:', error.message);
      throw error;
    }
  }
}

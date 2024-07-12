import {  BadRequestException,
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
import { LoginResponseDto } from './dto/auth-response.dto';

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

  async login(email: string, password: string): Promise<LoginResponseDto> {
    try {
      const user =
        await this.userProducerValidationService.validateUserProducerByEmail(
          email.toLowerCase(),
          password,
        );

      const haveOtp = await this.prisma.otp.findFirst({
        where: {
          userId: user.id,
          type: 'RECOVERY',
          verified: false,
        },
      });

      if (haveOtp) {
        throw new ConflictException(
          'You need to complete the password change process to log in',
        );
      }
      user.exp = new Date();

      const payload = { user: user };

      const accessToken = await this.jwtService.signAsync(payload, {
        secret: this.jwtSecret,
      });

      let haveTickets = false;
      let haveEvents = false;

      const tickets = await this.prisma.eventParticipant.findMany({
        where: {
          userId: user.id,
        },
      });

      if (tickets.length > 0) {
        haveTickets = true;
      }

      const events = await this.prisma.event.findMany({
        where: {
          userId: user.id,
        },
      });

      if (events.length > 0) {
        haveEvents = true;
      }

      const response: LoginResponseDto = {
        token: accessToken,
        userType: user.type,
        haveEvents,
        haveTickets,
      };

      return response;
    } catch (error) {
      throw error;
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
          email: email.toLowerCase(),
          eventId: eventExists.id,
        },
      });

      const passwordValid = compareSync(password, staff.password);

      if (!passwordValid) {
        throw new BadRequestException('Invalid password');
      }

      const staffFormatted = {
        id: staff.id,
        eventId: staff.eventId,
        email: staff.email,
        exp: new Date(),
      };

      const payload = { user: staffFormatted };

      const accessToken = this.jwtService.signAsync(payload, {
        secret: this.jwtSecret,
      });

      return accessToken;
    } catch (error) {
      throw error;
    }
  }

  async loginWithFacial(
    email: string,
    userPhoto: Express.Multer.File,
  ): Promise<LoginResponseDto> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const userFacial = await this.prisma.userFacial.findMany({
        where: {
          userId: user.id,
        },
        include: {
          user: true,
        },
        orderBy: {
          id: 'desc',
        },
      });

      const photo = await this.storageService.getFile(
        StorageServiceType.S3,
        userFacial[0].path,
      );

      const valid = await this.storageService.validateFacial(
        userPhoto.buffer,
        photo,
      );

      if (valid !== false && valid > 95) {
        delete user.password;

        const userFormatted = {
          id: user.id,
          name: user.name,
          email: user.email,
          dateBirth: user.dateBirth,
          profilePhoto: user.profilePhoto,
          type: user.type,
          cep: user.cep,
          document: user.document,
          phoneCountry: user.phoneCountry,
          phoneNumber: user.phoneNumber,
          street: user.street,
          district: user.district,
          city: user.city,
          complement: user.complement,
          country: user.country,
          createdAt: user.createdAt,
          number: user.number,
          state: user.state,
          validAt: user.validAt,
          exp: new Date(),
        };

        const payload = { user: userFormatted };

        const accessToken = await this.jwtService.signAsync(payload, {
          secret: this.jwtSecret,
        });

        let haveTickets = false;
        let haveEvents = false;

        const tickets = await this.prisma.eventParticipant.findMany({
          where: {
            userId: user.id,
          },
        });

        if (tickets.length > 0) {
          haveTickets = true;
        }

        const events = await this.prisma.event.findMany({
          where: {
            userId: user.id,
          },
        });

        if (events.length > 0) {
          haveEvents = true;
        }

        const response: LoginResponseDto = {
          token: accessToken,
          userType: user.type,
          haveEvents,
          haveTickets,
        };

        return response;
      } else {
        throw new ConflictException('Login with facial failed');
      }
    } catch (error) {
      throw error;
    }
  }
}

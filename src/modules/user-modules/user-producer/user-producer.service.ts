import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/services/prisma.service';
import { UserProducerCreateDto } from './dto/user-producer-create.dto';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';
import { AuthService } from 'src/modules/auth-modules/auth/auth.service';
import { genSaltSync, hash } from 'bcrypt';
import { UserProducerFinishSignUpDto } from './dto/user-producer-finish-sign-up.dto';
import { UserProducerResponseDto } from './dto/user-producer-response.dto';

@Injectable()
export class UserProducerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userProducerValidationService: UserProducerValidationService,
    private readonly authService: AuthService,
  ) {}

  async createUserProducer(body: UserProducerCreateDto): Promise<String> {
    try {
      const { confirmPassword, email, password } = body;

      const emailAlreadyExists =
        await this.userProducerValidationService.findUserByEmail(email);

      if (emailAlreadyExists) {
        throw new ConflictException('Email already exists');
      }

      if (password !== confirmPassword) {
        throw new ConflictException('Passwords do not match');
      }

      const salt = genSaltSync(10);
      const hashedPassword = await hash(password, salt);

      const createUser = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          type: 'PRODUCER',
        },
      });

      const token = await this.authService.login(createUser.email, password);

      return token;
    } catch (error) {
      throw new ConflictException(error);
    }
  }

  async finishSignUp(
    email: string,
    body: UserProducerFinishSignUpDto,
  ): Promise<String> {
    try {
      const emailAlreadyExists =
        await this.userProducerValidationService.findUserByEmail(email);

      if (!emailAlreadyExists) {
        throw new NotFoundException('User not found');
      }

      const { dateBirth, document, name, phoneCountry, phoneNumber } = body;

      await this.prisma.user.update({
        where: {
          email,
        },
        data: {
          name,
          dateBirth,
          document,
          phoneCountry,
          phoneNumber,
        },
      });

      return 'success';
    } catch (error) {
      throw new ConflictException(error);
    }
  }

  async findOneUserProducer(
    email: string,
  ): Promise<UserProducerResponseDto> {
    try {
      const user =
        await this.userProducerValidationService.findUserByEmail(
          email,
        );
  


      const response: UserProducerResponseDto = {
        id: user.id,
        email: user.email,
        name: user.name,
        dateBirth: user.dateBirth,
        document: user.document,
        phoneCountry: user.phoneCountry,
        phoneNumber: user.phoneNumber,
        profilePhoto: user.profilePhoto,
        street: user.street,
        district: user.district,
        state: user.state,
        city: user.city,
        country: user.country,
        number: user.number,
        complement: user.complement,
        cep: user.cep,
        createdAt: user.createdAt,
      };

      return response;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ConflictException(error);
    }
  }
}

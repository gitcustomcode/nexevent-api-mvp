import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from 'src/services/prisma.service';
import { UserProducerCreateDto } from './dto/user-producer-create.dto';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';
import { AuthService } from 'src/modules/auth-modules/auth/auth.service';
import { compareSync, genSaltSync, hash } from 'bcrypt';
import { UserProducerFinishSignUpDto } from './dto/user-producer-finish-sign-up.dto';
import { UserProducerResponseDto } from './dto/user-producer-response.dto';
import { randomUUID } from 'crypto';
import {
  StorageService,
  StorageServiceType,
} from 'src/services/storage.service';
import { validateCPF } from 'src/utils/cpf-validator';
import { FaceValidationService } from 'src/services/face-validation.service';
import {
  addYears,
  isAfter,
  isBefore,
  isValid,
  parse,
  subYears,
} from 'date-fns';
import { validateBirth } from 'src/utils/date-validator';
import { EmailService } from 'src/services/email.service';

@Injectable()
export class UserProducerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userProducerValidationService: UserProducerValidationService,
    private readonly storageService: StorageService,
    private readonly authService: AuthService,
    private readonly faceValidationService: FaceValidationService,
  ) {}

  async createUserProducer(body: UserProducerCreateDto): Promise<String> {
    try {
      const { confirmPassword, email, password } = body;

      const emailAlreadyExists =
        await this.userProducerValidationService.findUserByEmail(
          email.toLowerCase(),
        );

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
          email: email.toLowerCase(),
          password: hashedPassword,
          type: 'PRODUCER',
        },
      });

      const { token } = await this.authService.login(
        createUser.email,
        password,
      );

      return token;
    } catch (error) {
      throw error;
    }
  }

  async finishSignUp(
    email: string,
    body: UserProducerFinishSignUpDto,
  ): Promise<string> {
    try {
      const emailExists =
        await this.userProducerValidationService.findUserByEmail(email);

      if (!emailExists) {
        throw new NotFoundException('User not found');
      }

      const {
        dateBirth,
        document,
        name,
        phoneCountry,
        phoneNumber,
        street,
        district,
        state,
        city,
        country,
        number,
        complement,
        cep,
      } = body;

      validateBirth(dateBirth, true);

      if (country === 'Brasil' || phoneCountry === '55') {
        const documentValid = validateCPF(document);
        if (!documentValid) {
          throw new UnprocessableEntityException('Invalid CPF document');
        }
      }

      const validName = name.trim().split(' ');
      if (validName.length < 2) {
        throw new UnprocessableEntityException(
          'Please provide a complete name',
        );
      }

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
          street,
          district,
          state,
          city,
          country,
          number,
          complement,
          cep,
        },
      });

      return 'success';
    } catch (error) {
      throw error;
    }
  }

  async updatePassword(
    email: string,
    oldPassword: string,
    newPassword: string,
  ) {
    try {
      const emailAlreadyExists = await this.prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (!emailAlreadyExists) {
        throw new NotFoundException('User not found');
      }

      const passwordOldValid = compareSync(
        oldPassword,
        emailAlreadyExists.password,
      );

      if (!passwordOldValid) {
        throw new BadRequestException('Incorrect password');
      }

      const passwordNewValid = compareSync(
        newPassword,
        emailAlreadyExists.password,
      );

      if (passwordNewValid) {
        throw new BadRequestException(
          'The new password cannot be the same as the old one',
        );
      }

      const salt = genSaltSync(10);
      const hashedPassword = await hash(newPassword, salt);

      await this.prisma.user.update({
        where: {
          email,
        },
        data: {
          password: hashedPassword,
        },
      });

      return 'Password updated successfully';
    } catch (error) {
      throw error;
    }
  }

  async findOneUserProducer(email: string): Promise<UserProducerResponseDto> {
    try {
      const user =
        await this.userProducerValidationService.findUserByEmail(email);

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
      throw error;
    }
  }

  async uploadProfilePhoto(email: string, photo: Express.Multer.File) {
    try {
      const userExists =
        await this.userProducerValidationService.findUserByEmail(email);

      if (!userExists) {
        throw new NotFoundException('User not found');
      }

      const currentDate = new Date();
      const year = currentDate.getFullYear().toString();
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const day = currentDate.getDate().toString().padStart(2, '0');

      const uniqueFilename = `${randomUUID()}-${photo.originalname}`;
      const photoPath = `${year}/${month}/${day}/${uniqueFilename}`;

      await this.prisma.user.update({
        where: {
          id: userExists.id,
        },
        data: {
          profilePhoto: photoPath,
        },
      });

      await this.storageService.uploadFile(
        StorageServiceType.S3,
        photoPath,
        photo.buffer,
      );

      return 'Photo uploaded successfully';
    } catch (error) {
      throw error;
    }
  }

  async uploadFacialPhoto(email: string, photo: Express.Multer.File) {
    try {
      const userExists =
        await this.userProducerValidationService.findUserByEmail(email);

      if (!userExists) {
        throw new NotFoundException('User not found');
      }

      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];

      if (!allowedMimeTypes.includes(photo.mimetype)) {
        throw new BadRequestException(
          'Only JPEG, JPG and PNG files are allowed.',
        );
      }

      const validFace = await this.storageService.isFaceValid(photo.buffer);

      if (!validFace.isValid) {
        throw new UnprocessableEntityException(
          'A foto não possui um rosto, por favor tente novamente',
        );
      }

      const res = await this.faceValidationService.validateWithFacial(photo);

      if (res && res.email !== userExists.email) {
        throw new BadRequestException(
          `This face is already associated with other participant`,
        );
      }

      const currentDate = new Date();
      const year = currentDate.getFullYear().toString();
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const day = currentDate.getDate().toString().padStart(2, '0');

      const filename = photo.originalname;
      const fileExtension = filename.split('.').pop();

      const uniqueFilename = `${randomUUID()}.${fileExtension}`;

      const filePath = `user-face/${year}/${month}/${day}/${uniqueFilename}`;

      await this.storageService.uploadFile(
        StorageServiceType.S3,
        filePath,
        photo.buffer,
      );

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 60);

      await this.prisma.userFacial.create({
        data: {
          userId: userExists.id,
          path: filePath,
          expirationDate: expiryDate,
        },
      });

      return 'Photo uploaded successfully';
    } catch (error) {
      throw error;
    }
  }
}

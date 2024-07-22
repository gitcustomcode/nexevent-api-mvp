import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Post,
  Query,
  Request,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { FaceValidationService } from 'src/services/face-validation.service';
import { StripeService } from 'src/services/stripe.service';
import { LoginResponseDto } from './dto/auth-response.dto';
import {
  StorageService,
  StorageServiceType,
} from 'src/services/storage.service';
import { Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly faceValidationService: FaceValidationService,
    private readonly stripe: StripeService,
    private readonly storageService: StorageService,
  ) {}

  @Post('webhook')
  async test(@Request() req: any) {
    await this.stripe.webhook(req);
  }

  @Get('v1/auth/login')
  @ApiOperation({
    summary: 'Login',
  })
  @ApiResponse({
    description: 'the auth has been successfully',
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiQuery({
    name: 'userEmail',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'userPassword',
    required: true,
    type: String,
  })
  async login(
    @Query('userEmail') userEmail: string,
    @Query('userPassword') userPassword: string,
  ): Promise<LoginResponseDto> {
    /*   const string = `vbvcbcv&nbsp;
    <div><br></div><div>
    <img src="blob:http://localhost:5173/40755f1f-d989-4098-aa78-9878c837aee7" id="Screenshot_2">
    <img src="blob:http://localhost:5173/28e8c8d6-5c77-4e78-8eb4-f44c8ad07782" id="kueras">
    </div><div><br></div><div>dsadsa&nbsp;
    </div><div>dsadas&nbsp;</div><div>
    &nbsp;sadsadsa saddad dsds</div>`;

    const newSrc = 'https://example.com/img2';
    const test = 'Screenshot_2';

    const regex = new RegExp(`(<img\\s+[^>]*src=")[^"]*("[^>]*id="${test}">)`);
    const updatedString = string.replace(regex, `$1${newSrc}$2`);

    console.log(updatedString); */

    return await this.authService.login(userEmail, userPassword);
  }

  /*  @Get('v1/auth/login/:eventSlug')
  @ApiOperation({
    summary: 'Login',
  })
  @ApiResponse({
    description: 'the auth has been successfully',
    type: String,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'eventSlug',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'userEmail',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'userPassword',
    required: true,
    type: String,
  })
  async staffLogin(
    @Query('userEmail') userEmail: string,
    @Query('userPassword') userPassword: string,
    @Param('eventSlug') eventSlug: string,
  ): Promise<String> {
    return await this.authService.staffLogin(
      eventSlug,
      userEmail,
      userPassword,
    );
  }
 */
  @Post('v1/auth/validate-facial')
  @ApiOperation({ summary: 'Validate user with facial' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async validateWithFacial(@UploadedFile() file: Express.Multer.File) {
    return await this.faceValidationService.validateWithFacial(file);
  }

  @Post('v1/auth/login-with-facial')
  @ApiOperation({ summary: 'Login user with facial' })
  @ApiResponse({
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'email',
    required: true,
    type: String,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async loginWithFacial(
    @UploadedFile() file: Express.Multer.File,
    @Query('email') email: string,
  ): Promise<LoginResponseDto> {
    return await this.authService.loginWithFacial(email, file);
  }

  @Get('/v1/storage/file/:key')
  @ApiOperation({ summary: 'Find an file especific' })
  @Header('Content-Type', 'image/jpeg')
  @ApiProduces('image/jpeg')
  @ApiParam({
    name: 'key',
    example: '/face/file.jpg',
    description: 'File source',
  })
  @ApiOkResponse({
    status: 200,
    description: 'Image retrieved successfully',
    content: {
      'image/jpeg': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'File not found' })
  async file(@Param('key') key: string, @Res() res: Response): Promise<void> {
    try {
      const file = await this.storageService.getFile(
        StorageServiceType.S3,
        key,
      );

      res.header('Content-Type', 'image/jpeg'); // Substitua 'image/jpeg' pelo tipo correto, se necessário

      if (Buffer.isBuffer(file)) {
        // Verifica se file.photo é um buffer válido
        res.end(file);
      } else {
        // Se não for um buffer válido, retorne um erro 500 ou apropriado
        console.error('Erro: O conteúdo do arquivo não é um buffer válido.');
        res.status(500).send('Erro interno do servidor');
      }
    } catch (error) {
      console.error(`Erro ao buscar arquivo do S3: ${error}`);
      throw new NotFoundException(`Erro ao arquivo imagem do S3: ${error}`);
    }
  }
}

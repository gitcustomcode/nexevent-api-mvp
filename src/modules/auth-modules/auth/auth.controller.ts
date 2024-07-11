import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { FaceValidationService } from 'src/services/face-validation.service';
import { StripeService } from 'src/services/stripe.service';
import { LoginResponseDto } from './dto/auth-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly faceValidationService: FaceValidationService,
    private readonly stripe: StripeService,
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

  @Get('v1/auth/login/:eventSlug')
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
}

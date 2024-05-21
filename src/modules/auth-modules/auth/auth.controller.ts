import {
  Controller,
  Get,
  Param,
  Post,
  Query,
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

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('v1/auth/login')
  @ApiOperation({
    summary: 'Login',
  })
  @ApiResponse({
    description: 'the auth has been successfully',
    type: String,
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
  ): Promise<String> {
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
    return await this.authService.validateWithFacial(file);
  }

  @Post('v1/auth/login-with-facial')
  @ApiOperation({ summary: 'Login user with facial' })
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
  async loginWithEmail(
    @UploadedFile() file: Express.Multer.File,
    @Query('email') email: string,
  ) {
    return await this.authService.loginWithFacial(email, file);
  }
}

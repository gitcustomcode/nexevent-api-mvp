import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';

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
}

import {  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OtpService } from './otp.service';
import { AuthUserGuard } from 'src/modules/auth-modules/auth/auth-user.guards';
import { LoginResponseDto } from 'src/modules/auth-modules/auth/dto/auth-response.dto';

@ApiTags('Otp')
@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('v1/otp/forgot-password')
  @ApiOperation({
    summary: 'Forgot password',
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiQuery({ name: 'email', required: true, type: String })
  async forgotPassword(@Query('email') email: string): Promise<string> {
    return await this.otpService.forgotPassword(email);
  }

  @Get('v1/otp/validate-code')
  @ApiOperation({
    summary: 'Validate otp code',
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiQuery({ name: 'hash', required: true, type: String })
  @ApiQuery({ name: 'number', required: true, type: String })
  async validateOtp(
    @Query('hash') hash: string,
    @Query('number') number: string,
  ): Promise<string> {
    return await this.otpService.validateOtp(hash, number);
  }

  @Patch('v1/otp/change-password')
  @ApiOperation({
    summary: 'Validate otp code',
  })
  @ApiResponse({
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiQuery({ name: 'hash', required: true, type: String })
  @ApiQuery({ name: 'number', required: true, type: String })
  @ApiQuery({ name: 'password', required: true, type: String })
  async changePassword(
    @Query('hash') hash: string,
    @Query('number') number: string,
    @Query('password') password: string,
  ): Promise<LoginResponseDto> {
    return await this.otpService.changePassword(hash, number, password);
  }

  @Post('v1/otp/verify-email')
  @ApiOperation({
    summary: 'Forgot password',
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiQuery({
    name: 'email',
    required: true,
    type: String,
  })
  async verifyEmail(@Query('email') email: string): Promise<string> {
    return await this.otpService.verifyEmail(email.toLowerCase());
  }

  @Post('v1/otp/verify-email-code')
  @ApiOperation({
    summary: 'Forgot password',
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiQuery({
    name: 'code',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'email',
    required: true,
    type: String,
  })
  async verifyEmailCode(
    @Query('email') email: string,
    @Query('code') code: string,
  ): Promise<string> {
    return await this.otpService.verifyEmailCode(email.toLowerCase(), code);
  }
}

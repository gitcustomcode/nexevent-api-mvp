import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { OtpService } from './otp.service';

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
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiQuery({ name: 'hash', required: true, type: String })
  @ApiQuery({ name: 'number', required: true, type: String })
  @ApiQuery({ name: 'password', required: true, type: String })
  async changePassword(
    @Query('hash') hash: string,
    @Query('number') number: string,
    @Query('password') password: string,
  ): Promise<string> {
    return await this.otpService.changePassword(hash, number, password);
  }
}

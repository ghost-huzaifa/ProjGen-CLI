import { Body, Controller, Post, HttpCode, HttpStatus, UseGuards, Req, Res, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '@common/decorators/public.decorator';
import { AuthGuard } from '@nestjs/passport';
import { LoginResponseDto } from './dto/login-response.dto';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CheckUserExistDto } from './dto/check-user-exist.dto';

@ApiTags('Authentication')
@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @UseGuards(AuthGuard('local'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ description: 'Authenticates user credentials and returns user data with access token' })
  @ApiBody({ type: LoginDto })
  async login(@Request() req, @Res({ passthrough: true }) res: Response): Promise<LoginResponseDto> {
    const loginResponse = await this.authService.login(req.user);

    const cookieName = this.configService.get<string>('AUTH_COOKIE_NAME') || 'AccessToken';
    const cookieDomain = this.configService.get<string>('AUTH_COOKIE_DOMAIN');

    res.cookie(cookieName, loginResponse.accessToken, {
      httpOnly: false,
      sameSite: 'lax',
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    });

    return loginResponse;
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ description: 'Creates a new user account and returns registered user data with access token' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() registerDto: RegisterDto): Promise<LoginResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ description: 'Revokes refresh token and clears cookie' })
  async logout(@Request() req): Promise<{ message: string }> {
    const accessToken = req.body?.accessToken;

    if (accessToken) {
      // Blacklist the access token
      // TODO: await this.authService.blacklistAccessToken(accessToken);
    }

    return { message: 'Logged out successfully' };
  }

  // @Post('forgot-password')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ description: 'Sends a OTP' })
  // @ApiBody({ type: ForgotPasswordDto })
  // async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<{
  //   otpId: string;
  //   expiryTime: number;
  // }> {
  //   return await this.authService.forgotPassword(forgotPasswordDto);
  // }

  // @Post('otp-verification')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ description: 'Check the OTP' })
  // @ApiBody({ type: ForgotPasswordDto })
  // async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): Promise<any> {
  //   return await this.authService.verifyOtp(verifyOtpDto);
  // }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ description: 'Resets the password' })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() resetPassword: ResetPasswordDto): Promise<any> {
    return await this.authService.resetPassword(resetPassword);
  }

  @Post('user-exist')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ description: 'Check if a user exists by phone number' })
  @ApiBody({ type: CheckUserExistDto })
  async checkUserExist(@Body() dto: CheckUserExistDto): Promise<{ exists: boolean }> {
    const exists = await this.authService.checkUserExist(dto.phoneNumber);
    return { exists };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ description: 'Refreshes the access token' })
  async refresh(@Body() req, @Res({ passthrough: true }) res: Response): Promise<LoginResponseDto> {
    const oldToken = req.accessToken;
    if (!oldToken) {
      throw new Error('Access token not found');
    }

    let accessTokenPayload = await this.authService.refreshAccessToken(oldToken);

    const cookieName = this.configService.get<string>('AUTH_COOKIE_NAME') || 'AccessToken';
    const cookieDomain = this.configService.get<string>('AUTH_COOKIE_DOMAIN');

    res.cookie(cookieName, accessTokenPayload.accessToken, {
      httpOnly: false,
      sameSite: 'lax',
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    });

    return accessTokenPayload;
  }
}

import { Controller, Post, Body, Get, UseGuards, Request, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  InitiateOTPRegistrationDto,
  VerifyOTPAndRegisterDto,
  RequestMagicLinkDto,
  VerifyMagicLinkAndRegisterDto,
  InitiateOTPLoginDto,
  VerifyOTPAndLoginDto,
  RequestMagicLinkLoginDto,
  VerifyMagicLinkAndLoginDto,
  RefreshTokenDto,
  DemoAccountRegistrationDto,
  AuthResponseDto,
  OTPResponseDto,
  MagicLinkResponseDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

/**
 * Auth Controller - Handles all authentication endpoints
 * Routes:
 * - OTP-based registration (WhatsApp/SMS)
 * - OTP-based login (WhatsApp/SMS)
 * - Magic Link-based registration (Email)
 * - Magic Link-based login (Email)
 * - Token refresh
 * - Logout
 * - Demo account registration
 */
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ========== OTP Registration ==========

  @Post('register/otp/initiate')
  @HttpCode(HttpStatus.OK)
  async initiateOTPRegistration(
    @Body() dto: InitiateOTPRegistrationDto,
    @Request() req: any,
  ): Promise<OTPResponseDto> {
    const result = await this.authService.initiateOTPRegistration(
      dto.phoneNumber,
      dto.channel || 'whatsapp',
      dto.language || 'EN',
      req.ip,
    );

    return {
      success: true,
      data: {
        otpToken: result.otpToken,
        expiresIn: result.expiresIn,
        channel: dto.channel || 'whatsapp',
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Post('register/otp/verify')
  @HttpCode(HttpStatus.CREATED)
  async verifyOTPAndRegister(
    @Body() dto: VerifyOTPAndRegisterDto,
    @Request() req: any,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.verifyOTPAndCompleteRegistration(
      dto.otpToken,
      dto.otp,
      dto.firstName,
      dto.lastName,
      dto.email,
      dto.role,
      dto.isDemoAccount,
      req.ip,
    );

    return {
      success: true,
      data: {
        user: result.user,
        tokens: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresIn: 15 * 60 * 1000, // 15 minutes
          tokenType: 'Bearer',
        },
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // ========== Magic Link Registration ==========

  @Post('register/magic-link/request')
  @HttpCode(HttpStatus.OK)
  async requestMagicLinkRegistration(
    @Body() dto: RequestMagicLinkDto,
    @Request() req: any,
  ): Promise<MagicLinkResponseDto> {
    await this.authService.requestMagicLinkRegistration(dto.email, req.ip);

    return {
      success: true,
      data: {
        message: 'Check your email for the magic link to complete registration',
        email: dto.email,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Post('register/magic-link/verify')
  @HttpCode(HttpStatus.CREATED)
  async verifyMagicLinkAndRegister(
    @Body() dto: VerifyMagicLinkAndRegisterDto,
    @Request() req: any,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.verifyMagicLinkAndCompleteRegistration(
      dto.token,
      dto.firstName,
      dto.lastName,
      dto.phoneNumber,
      dto.role,
      dto.isDemoAccount,
      req.ip,
    );

    return {
      success: true,
      data: {
        user: result.user,
        tokens: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresIn: 15 * 60 * 1000,
          tokenType: 'Bearer',
        },
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // ========== OTP Login ==========

  @Post('login/otp/initiate')
  @HttpCode(HttpStatus.OK)
  async initiateOTPLogin(
    @Body() dto: InitiateOTPLoginDto,
    @Request() req: any,
  ): Promise<OTPResponseDto> {
    const result = await this.authService.initiateOTPLogin(
      dto.phoneNumber,
      dto.channel || 'whatsapp',
      dto.language || 'EN',
      req.ip,
    );

    return {
      success: true,
      data: {
        otpToken: result.otpToken,
        expiresIn: result.expiresIn,
        channel: dto.channel || 'whatsapp',
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Post('login/otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOTPAndLogin(
    @Body() dto: VerifyOTPAndLoginDto,
    @Request() req: any,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.verifyOTPAndLogin(dto.otpToken, dto.otp, req.ip);

    return {
      success: true,
      data: {
        user: result.user,
        tokens: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresIn: 15 * 60 * 1000,
          tokenType: 'Bearer',
        },
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // ========== Magic Link Login ==========

  @Post('login/magic-link/request')
  @HttpCode(HttpStatus.OK)
  async requestMagicLinkLogin(
    @Body() dto: RequestMagicLinkLoginDto,
    @Request() req: any,
  ): Promise<MagicLinkResponseDto> {
    await this.authService.requestMagicLinkLogin(dto.email, req.ip);

    return {
      success: true,
      data: {
        message: 'Check your email for the magic link to sign in',
        email: dto.email,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Post('login/magic-link/verify')
  @HttpCode(HttpStatus.OK)
  async verifyMagicLinkAndLogin(
    @Body() dto: VerifyMagicLinkAndLoginDto,
    @Request() req: any,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.verifyMagicLinkAndLogin(dto.token, req.ip);

    return {
      success: true,
      data: {
        user: result.user,
        tokens: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresIn: 15 * 60 * 1000,
          tokenType: 'Bearer',
        },
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // ========== Token Management ==========

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenDto) {
    const result = await this.authService.refreshAccessToken(dto.refreshToken);

    return {
      success: true,
      data: {
        accessToken: result.accessToken,
        tokenType: 'Bearer',
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: any) {
    await this.authService.logout(req.user.sub);

    return {
      success: true,
      data: { message: 'Logged out successfully' },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // ========== Demo Account ==========

  @Post('demo/register')
  @HttpCode(HttpStatus.CREATED)
  async registerDemoAccount(
    @Body() dto: DemoAccountRegistrationDto,
  ): Promise<AuthResponseDto> {
    if (!dto.role) {
      throw new BadRequestException('Role is required for demo account');
    }

    const result = await this.authService.registerDemoAccount(dto.role, dto.language || 'EN');

    return {
      success: true,
      data: {
        user: result.user,
        tokens: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresIn: 15 * 60 * 1000,
          tokenType: 'Bearer',
        },
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // ========== Me (Get current user) ==========

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Request() req: any) {
    return {
      success: true,
      data: { user: req.user },
      meta: { timestamp: new Date().toISOString() },
    };
  }
}

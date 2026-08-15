import { IsEmail, IsPhoneNumber, IsString, IsEnum, IsOptional, IsBoolean, Length } from 'class-validator';
import { UserRole } from '@modules/users/enums/user-role.enum';

/**
 * Auth DTOs - Data Transfer Objects for authentication endpoints
 * Implements input validation and security constraints
 */

// ========== OTP-Based Registration ==========

export class InitiateOTPRegistrationDto {
  @IsPhoneNumber('IN') // India phone number validation
  phoneNumber: string;

  @IsOptional()
  @IsEnum(['EN', 'HI'])
  language?: 'EN' | 'HI';

  @IsOptional()
  @IsEnum(['sms', 'whatsapp'])
  channel?: 'sms' | 'whatsapp';
}

export class VerifyOTPAndRegisterDto {
  @IsString()
  otpToken: string;

  @IsString()
  @Length(6, 6)
  otp: string; // 6-digit OTP

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isDemoAccount?: boolean;
}

// ========== Magic Link Registration ==========

export class RequestMagicLinkDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(['EN', 'HI'])
  language?: 'EN' | 'HI';
}

export class VerifyMagicLinkAndRegisterDto {
  @IsString()
  token: string; // Magic link token from email

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsPhoneNumber('IN')
  phoneNumber?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isDemoAccount?: boolean;
}

// ========== OTP-Based Login ==========

export class InitiateOTPLoginDto {
  @IsPhoneNumber('IN')
  phoneNumber: string;

  @IsOptional()
  @IsEnum(['sms', 'whatsapp'])
  channel?: 'sms' | 'whatsapp';

  @IsOptional()
  @IsEnum(['EN', 'HI'])
  language?: 'EN' | 'HI';
}

export class VerifyOTPAndLoginDto {
  @IsString()
  otpToken: string;

  @IsString()
  @Length(6, 6)
  otp: string;

  @IsOptional()
  @IsString()
  deviceId?: string; // For mobile app device tracking
}

// ========== Magic Link Login ==========

export class RequestMagicLinkLoginDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(['EN', 'HI'])
  language?: 'EN' | 'HI';
}

export class VerifyMagicLinkAndLoginDto {
  @IsString()
  token: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

// ========== Token Refresh ==========

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

// ========== Logout ==========

export class LogoutDto {
  @IsOptional()
  @IsString()
  refreshToken?: string; // Optional, for blacklisting
}

// ========== Demo Account Registration ==========

export class DemoAccountRegistrationDto {
  @IsEnum(UserRole)
  role: UserRole; // Which role to demo as

  @IsOptional()
  @IsEnum(['EN', 'HI'])
  language?: 'EN' | 'HI';
}

// ========== Response DTOs ==========

export class AuthTokenResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // milliseconds
  tokenType: string; // 'Bearer'
}

export class AuthResponseDto {
  success: boolean;
  data: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber?: string;
      role: UserRole;
      status: string; // AccountStatus enum
      isDemoAccount: boolean;
    };
    tokens: AuthTokenResponseDto;
  };
  meta: {
    timestamp: string;
  };
}

export class OTPResponseDto {
  success: boolean;
  data: {
    otpToken: string; // Reference token for verification
    expiresIn: number; // milliseconds
    channel: 'sms' | 'whatsapp' | 'email';
  };
  meta: {
    timestamp: string;
  };
}

export class MagicLinkResponseDto {
  success: boolean;
  data: {
    message: string;
    email: string;
  };
  meta: {
    timestamp: string;
  };
}

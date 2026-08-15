import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OTPService } from './services/otp.service';
import { MagicLinkService } from './services/magic-link.service';
import { User } from '@modules/users/entities/user.entity';
import { OTPToken } from './entities/otp-token.entity';
import { MagicLink } from './entities/magic-link.entity';
import { CommunicationModule } from '@modules/communication/communication.module';
import { SharedModule } from '@modules/shared/shared.module';
import { RateLimitService } from '@common/services/rate-limit.service';
import { IdempotencyService } from '@common/services/idempotency.service';

/**
 * Auth Module - Authentication with OTP and Magic Link support
 * Phase 2A: MSG91 WhatsApp OTP, Magic Link, secure token management
 * Separate from Communication module for clear separation of concerns
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, OTPToken, MagicLink]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: '15m',
          algorithm: 'HS256',
        },
      }),
    }),
    CommunicationModule,
    SharedModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, OTPService, MagicLinkService, RateLimitService, IdempotencyService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunicationService } from './communication.service';
import { ProviderConfig } from './entities/provider-config.entity';
import { OTPToken } from '@modules/auth/entities/otp-token.entity';
import { OTPService } from '@modules/auth/services/otp.service';
import { IdempotencyService } from '@common/services/idempotency.service';
import { SharedModule } from '@modules/shared/shared.module';

/**
 * Communication Module - Handles SMS, WhatsApp, Email, Push notifications
 * Provider-agnostic: Routes to configured providers based on database config
 * Separate from Auth module to maintain clear separation of concerns
 * Can be used by any module needing to send messages
 *
 * Supported Providers:
 * - MSG91 (SMS, WhatsApp OTP, templates)
 * - Twilio (SMS)
 * - Sendgrid (Email)
 * - Local/Manual (development/testing)
 * - WhatsApp Business API
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ProviderConfig, OTPToken]),
    SharedModule,
  ],
  providers: [CommunicationService, OTPService, IdempotencyService],
  exports: [CommunicationService],
})
export class CommunicationModule {}

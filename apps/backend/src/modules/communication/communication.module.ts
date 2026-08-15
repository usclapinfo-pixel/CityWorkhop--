import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@modules/auth/auth.module';
import { CommunicationService } from './communication.service';
import { ProviderConfig } from './entities/provider-config.entity';
import { ProviderCapability } from './entities/provider-capability.entity';
import { CityProviderMapping } from './entities/city-provider-mapping.entity';
import { ProviderRoutingRule } from './entities/provider-routing-rule.entity';
import { OTPToken } from '@modules/auth/entities/otp-token.entity';
import { OTPService } from '@modules/auth/services/otp.service';
import { IdempotencyService } from '@common/services/idempotency.service';
import { SharedModule } from '@modules/shared/shared.module';
import { ProviderResolverService } from './providers/provider-resolver.service';
import { ProviderRegistryService } from './providers/provider-registry.service';
import { ProviderConfigService } from './providers/provider-config.service';
import { ProviderSecretStorageService } from './services/provider-secret-storage.service';
import { ProviderAdminController } from './controllers/provider-admin.controller';
import { Msg91Provider } from './providers/msg91.provider';
import { WhatsAppBusinessProvider } from './providers/whatsapp-business.provider';
import { LocalWhatsAppProvider } from './providers/local-whatsapp.provider';
import { N8nAutomationProvider } from './providers/n8n.provider';

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
    TypeOrmModule.forFeature([ProviderConfig, ProviderCapability, CityProviderMapping, ProviderRoutingRule, OTPToken]),
    SharedModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [ProviderAdminController],
  providers: [
    CommunicationService,
    OTPService,
    IdempotencyService,
    ProviderResolverService,
    ProviderRegistryService,
    ProviderConfigService,
    ProviderSecretStorageService,
    Msg91Provider,
    WhatsAppBusinessProvider,
    LocalWhatsAppProvider,
    N8nAutomationProvider,
  ],
  exports: [CommunicationService, ProviderResolverService, ProviderConfigService, ProviderSecretStorageService],
})
export class CommunicationModule {}

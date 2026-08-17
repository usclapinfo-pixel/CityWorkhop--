import { Injectable } from '@nestjs/common';
import { ProviderConfig } from './entities/provider-config.entity';
import { ICommunicationService } from './interfaces/communication.interface';
import { ProviderType } from './interfaces/provider.interface';
import { OTPService } from '@modules/auth/services/otp.service';
import { ProviderResolverService } from './providers/provider-resolver.service';
import { ProviderRegistryService } from './providers/provider-registry.service';
import { AuditService } from '@modules/shared/audit/audit.service';

/**
 * Communication Service - Provider-agnostic wrapper
 * Routes requests to appropriate provider based on database configuration
 * Supports city-wise provider selection with fallback
 *
 * Providers:
 * - MSG91 (SMS, WhatsApp, OTP)
 * - Twilio (SMS)
 * - Sendgrid (Email)
 * - Local/Manual (for development)
 */
@Injectable()
export class CommunicationService implements ICommunicationService {
  constructor(
    private readonly otpService: OTPService,
    private readonly providerResolverService: ProviderResolverService,
    private readonly providerRegistryService: ProviderRegistryService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Get active provider for city and channel
   * Returns highest-priority active provider
   */
  private async getActiveProvider(
    channel: 'sms' | 'whatsapp' | 'email',
    cityId?: string,
    moduleName?: string,
  ): Promise<ProviderConfig | null> {
    return this.providerResolverService.resolveProvider(channel, cityId, moduleName);
  }

  async sendOTP(
    phoneNumber: string,
    options?: {
      language?: string;
      channel?: 'sms' | 'whatsapp';
      cityId?: string;
      otpToken?: string;
      otpCode?: string;
    },
  ): Promise<{ otpToken: string; expiresIn: number }> {
    const channel = options?.channel || 'sms';
    const isProduction = process.env.NODE_ENV === 'production';

    // Get provider configuration
    const provider = await this.getActiveProvider(channel, options?.cityId, 'auth');

    if (!provider) {
      if (isProduction) {
        const message = 'No active OTP provider configured for production OTP delivery.';

        await this.auditService.log({
          eventType: 'communication.provider_missing',
          action: 'otp_request',
          phoneNumber,
          status: 'failure',
          severity: 'high',
          errorMessage: message,
          metadata: {
            channel,
            cityId: options?.cityId,
            deliveryMode: 'production_no_provider',
            otpCodePresent: Boolean(options?.otpCode),
          },
        });

        throw new Error(message);
      }

      const devOtpMessage = options?.otpCode
        ? `[DEV MOCK OTP] No active ${channel} provider configured for city ${options?.cityId}. Mock delivery is enabled only for local development/test. OTP code is intentionally not exposed in logs.`
        : `[DEV MOCK OTP] No active ${channel} provider configured for city ${options?.cityId}. Mock delivery is enabled only for local development/test.`;

      console.warn(devOtpMessage);
      await this.auditService.log({
        eventType: 'communication.provider_missing',
        action: 'otp_request',
        phoneNumber,
        status: 'warning',
        severity: 'medium',
        metadata: {
          channel,
          cityId: options?.cityId,
          deliveryMode: 'dev_mock',
          otpCodePresent: Boolean(options?.otpCode),
          mockAllowed: true,
        },
      });
      return {
        otpToken: options?.otpToken ?? '',
        expiresIn: 0,
      };
    }

    const adapter = this.providerRegistryService.getProvider(provider.providerType as ProviderType);

    try {
      if (adapter?.sendOTP) {
        const response = await adapter.sendOTP(phoneNumber, {
          otpToken: options?.otpToken,
          otpCode: options?.otpCode,
          channel,
          language: options?.language,
        });

        await this.auditService.log({
          eventType: 'communication.provider_send_otp',
          action: 'otp_request',
          phoneNumber,
          status: response.success ? 'success' : 'failure',
          severity: response.success ? 'low' : 'high',
          metadata: { providerType: provider.providerType, response },
        });
      }
    } catch (error) {
      console.error(`Error sending OTP via ${provider.providerType}:`, error);
      await this.auditService.log({
        eventType: 'communication.provider_send_otp_failed',
        action: 'otp_request',
        phoneNumber,
        status: 'failure',
        severity: 'high',
        errorMessage: error instanceof Error ? error.message : 'Unknown provider error',
        metadata: { providerType: provider.providerType },
      });
    }

    return {
      otpToken: options?.otpToken ?? '',
      expiresIn: 0,
    };
  }

  async verifyOTP(otpToken: string, otp: string): Promise<boolean> {
    const result = await this.otpService.verifyOTP(otpToken, otp);
    return result.success;
  }

  async sendWhatsAppMessage(
    phoneNumber: string,
    templateName: string,
    parameters?: Record<string, any>,
  ): Promise<{ messageId: string; status: string }> {
    const provider = await this.getActiveProvider('whatsapp', parameters?.cityId, 'communication');

    if (!provider) {
      throw new Error('No active WhatsApp provider configured');
    }

    const adapter = this.providerRegistryService.getProvider(provider.providerType as ProviderType);

    if (adapter?.sendWhatsApp) {
      const result = await adapter.sendWhatsApp(phoneNumber, templateName, parameters ?? {});
      return {
        messageId: result.messageId ?? `whatsapp-${Date.now()}`,
        status: result.status ?? 'queued',
      };
    }

    throw new Error(`WhatsApp not supported by provider ${provider.providerType}`);
  }

  async sendMagicLink(email: string, link: string): Promise<void> {
    const provider = await this.getActiveProvider('email');

    if (!provider) {
      console.warn('No active email provider configured');
      return;
    }

    const subject = 'Sign in to City Workshop';
    const htmlBody = `
      <p>Click the link below to sign in to your City Workshop account:</p>
      <a href="${link}">Sign In</a>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't request this link, you can safely ignore this email.</p>
    `;

    const adapter = this.providerRegistryService.getProvider(provider.providerType as ProviderType);

    if (adapter?.sendEmail) {
      await adapter.sendEmail(email, subject, htmlBody, { link });
      return;
    }

    console.warn(`Email not supported by provider ${provider.providerType}`);
  }

  async sendEmail(to: string, subject: string, htmlBody: string): Promise<void> {
    const provider = await this.getActiveProvider('email');

    if (!provider) {
      console.warn('No active email provider configured');
      return;
    }

    const adapter = this.providerRegistryService.getProvider(provider.providerType as ProviderType);
    if (adapter?.sendEmail) {
      await adapter.sendEmail(to, subject, htmlBody, { source: 'sendEmail' });
    }
  }

  async sendSMS(phoneNumber: string, message: string): Promise<void> {
    const provider = await this.getActiveProvider('sms', undefined, 'sms');

    if (!provider) {
      console.warn('No active SMS provider configured');
      return;
    }

    const adapter = this.providerRegistryService.getProvider(provider.providerType as ProviderType);

    if (adapter?.sendOTP) {
      await adapter.sendOTP(phoneNumber, { message });
    }
  }

  async getProviderStatus(): Promise<{ isHealthy: boolean; lastChecked: Date; message?: string }> {
    // TODO: Implement health check for all providers
    return {
      isHealthy: true,
      lastChecked: new Date(),
      message: 'All providers operational',
    };
  }

}

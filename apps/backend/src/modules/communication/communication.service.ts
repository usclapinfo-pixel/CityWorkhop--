import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ProviderConfig } from './entities/provider-config.entity';
import { ICommunicationService } from './interfaces/communication.interface';
import { OTPService } from '@modules/auth/services/otp.service';

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
    @InjectRepository(ProviderConfig)
    private readonly providerConfigRepository: Repository<ProviderConfig>,
    private readonly otpService: OTPService,
  ) {}

  /**
   * Get active provider for city and channel
   * Returns highest-priority active provider
   */
  private async getActiveProvider(
    channel: 'sms' | 'whatsapp' | 'email',
    cityId?: string,
  ): Promise<ProviderConfig | null> {
    // Try city-specific provider first
    if (cityId) {
      const cityProvider = await this.providerConfigRepository.findOne({
        where: {
          cityId,
          channel,
          isActive: true,
        },
        order: { priority: 'ASC' },
      });

      if (cityProvider) {
        return cityProvider;
      }
    }

    // Fall back to global provider
    return this.providerConfigRepository.findOne({
      where: {
        cityId: IsNull(),
        channel,
        isActive: true,
      },
      order: { priority: 'ASC' },
    });
  }

  async sendOTP(
    phoneNumber: string,
    options?: { language?: string; channel?: 'sms' | 'whatsapp'; cityId?: string },
  ): Promise<{ otpToken: string; expiresIn: number }> {
    const channel = options?.channel || 'sms';

    // Generate OTP via OTPService
    const result = await this.otpService.generateOTP(phoneNumber, null, {
      channel: channel as any,
      language: options?.language as any,
    });

    // Get provider configuration
    const provider = await this.getActiveProvider(channel, options?.cityId);

    if (!provider) {
      // Fallback: just return OTP token (no actual sending in this case)
      console.warn(`No active ${channel} provider configured for city ${options?.cityId}`);
      return result;
    }

    // Send via appropriate provider
    try {
      if (provider.providerType === 'MSG91') {
        await this.sendViaMsg91OTP(phoneNumber, result.otpToken, provider, options?.language);
      } else if (provider.providerType === 'TWILIO') {
        await this.sendViaTwilioSMS(phoneNumber, result.otpToken, provider);
      } else if (provider.providerType === 'LOCAL_WHATSAPP') {
        console.log(`[LOCAL] WhatsApp OTP sent to ${phoneNumber}`);
      } else if (provider.providerType === 'MANUAL') {
        console.log(`[MANUAL] Admin should send OTP to ${phoneNumber}`);
      }
    } catch (error) {
      console.error(`Error sending OTP via ${provider.providerType}:`, error);
      // Still return OTP token - provider can retry later
    }

    return result;
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
    const provider = await this.getActiveProvider('whatsapp', parameters?.cityId);

    if (!provider) {
      throw new Error('No active WhatsApp provider configured');
    }

    // Send via appropriate provider
    if (provider.providerType === 'MSG91') {
      return this.sendViaMsg91WhatsApp(phoneNumber, templateName, parameters, provider);
    } else if (provider.providerType === 'WHATSAPP_BUSINESS_API') {
      return this.sendViaWhatsAppBusinessAPI(phoneNumber, templateName, parameters, provider);
    } else if (provider.providerType === 'LOCAL_WHATSAPP') {
      // For local development
      return {
        messageId: `local-${Date.now()}`,
        status: 'queued',
      };
    } else {
      throw new Error(`WhatsApp not supported by provider ${provider.providerType}`);
    }
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

    if (provider.providerType === 'SENDGRID') {
      await this.sendViaSendgrid(email, subject, htmlBody, provider);
    } else if (provider.providerType === 'MANUAL') {
      console.log(`[MANUAL] Send magic link email to ${email}`);
    } else {
      console.warn(`Email not supported by provider ${provider.providerType}`);
    }
  }

  async sendEmail(to: string, subject: string, htmlBody: string): Promise<void> {
    const provider = await this.getActiveProvider('email');

    if (!provider) {
      console.warn('No active email provider configured');
      return;
    }

    if (provider.providerType === 'SENDGRID') {
      await this.sendViaSendgrid(to, subject, htmlBody, provider);
    }
  }

  async sendSMS(phoneNumber: string, message: string): Promise<void> {
    const provider = await this.getActiveProvider('sms');

    if (!provider) {
      console.warn('No active SMS provider configured');
      return;
    }

    if (provider.providerType === 'MSG91') {
      await this.sendViaTwilioSMS(phoneNumber, message, provider);
    } else if (provider.providerType === 'TWILIO') {
      await this.sendViaTwilioSMS(phoneNumber, message, provider);
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

  // Private provider-specific implementations

  private async sendViaMsg91OTP(
    phoneNumber: string,
    otpToken: string,
    provider: ProviderConfig,
    language?: string,
  ): Promise<void> {
    // TODO: Implement actual MSG91 API call
    // This is a stub - actual implementation requires MSG91 SDK/HTTP client
    console.log(`[MSG91] OTP ${otpToken} (${language ?? 'EN'}) would be sent to ${phoneNumber} via ${provider.providerType}`);
    // Example:
    // const response = await fetch('https://api.msg91.com/app/smsapi/send', {
    //   method: 'POST',
    //   body: new URLSearchParams({
    //     route: 'otp',
    //     mobiles: phoneNumber,
    //     authkey: provider.credentials.apiKey,
    //   }),
    // });
  }

  private async sendViaMsg91WhatsApp(
    phoneNumber: string,
    templateName: string,
    parameters: Record<string, any> | undefined,
    _provider?: ProviderConfig,
  ): Promise<{ messageId: string; status: string }> {
    // TODO: Implement actual MSG91 WhatsApp API call
    console.log(`[MSG91 WhatsApp] Message to ${phoneNumber} with template ${templateName} and params ${JSON.stringify(parameters ?? {})}`);
    return {
      messageId: `msg91-${Date.now()}`,
      status: 'queued',
    };
  }

  private async sendViaTwilioSMS(
    phoneNumber: string,
    message: string,
    _provider?: ProviderConfig,
  ): Promise<void> {
    // TODO: Implement actual Twilio API call
    console.log(`[Twilio] SMS to ${phoneNumber}: ${message}`);
  }

  private async sendViaWhatsAppBusinessAPI(
    phoneNumber: string,
    templateName: string,
    _parameters?: Record<string, any>,
    _provider?: ProviderConfig,
  ): Promise<{ messageId: string; status: string }> {
    // TODO: Implement actual WhatsApp Business API call
    console.log(`[WhatsApp Business API] Message to ${phoneNumber} with template ${templateName}`);
    return {
      messageId: `waba-${Date.now()}`,
      status: 'queued',
    };
  }

  private async sendViaSendgrid(
    to: string,
    subject: string,
    _htmlBody?: string,
    _provider?: ProviderConfig,
  ): Promise<void> {
    // TODO: Implement actual Sendgrid API call
    console.log(`[Sendgrid] Email to ${to} - Subject: ${subject}`);
  }
}

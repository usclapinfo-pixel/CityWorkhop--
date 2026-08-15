import { Injectable } from '@nestjs/common';
import { CommunicationChannel, IProviderAdapter, ProviderDeliveryResult, ProviderHealthStatus, ProviderType } from '../interfaces/provider.interface';

@Injectable()
export class Msg91Provider implements IProviderAdapter {
  readonly type: ProviderType = 'MSG91';

  supports(channel: CommunicationChannel): boolean {
    return channel === 'sms' || channel === 'whatsapp';
  }

  async sendOTP(phoneNumber: string, payload: Record<string, any>): Promise<ProviderDeliveryResult> {
    return {
      success: true,
      status: 'queued',
      providerType: this.type,
      messageId: `msg91-otp-${Date.now()}`,
      metadata: {
        phoneNumber,
        language: payload?.language ?? 'EN',
      },
    };
  }

  async sendWhatsApp(phoneNumber: string, templateName: string, payload?: Record<string, any>): Promise<ProviderDeliveryResult> {
    return {
      success: true,
      status: 'queued',
      providerType: this.type,
      messageId: `msg91-wa-${Date.now()}`,
      metadata: {
        phoneNumber,
        templateName,
        variables: payload ?? {},
      },
    };
  }

  async getHealth(): Promise<ProviderHealthStatus> {
    return {
      isHealthy: true,
      lastChecked: new Date(),
      message: 'MSG91 provider adapter is enabled but not connected to a live account in this phase.',
    };
  }
}

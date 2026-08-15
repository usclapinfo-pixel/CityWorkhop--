import { Injectable } from '@nestjs/common';
import { CommunicationChannel, IProviderAdapter, ProviderDeliveryResult, ProviderHealthStatus, ProviderType } from '../interfaces/provider.interface';

@Injectable()
export class WhatsAppBusinessProvider implements IProviderAdapter {
  readonly type: ProviderType = 'WHATSAPP_BUSINESS_API';

  supports(channel: CommunicationChannel): boolean {
    return channel === 'whatsapp';
  }

  async sendWhatsApp(phoneNumber: string, templateName: string, payload?: Record<string, any>): Promise<ProviderDeliveryResult> {
    return {
      success: true,
      status: 'queued',
      providerType: this.type,
      messageId: `waba-${Date.now()}`,
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
      message: 'WhatsApp Business provider adapter is enabled but not connected to a live provider in this phase.',
    };
  }
}

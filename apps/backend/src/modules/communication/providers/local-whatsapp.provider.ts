import { Injectable } from '@nestjs/common';
import { CommunicationChannel, IProviderAdapter, ProviderDeliveryResult, ProviderHealthStatus, ProviderType } from '../interfaces/provider.interface';

@Injectable()
export class LocalWhatsAppProvider implements IProviderAdapter {
  readonly type: ProviderType = 'LOCAL_WHATSAPP';

  supports(channel: CommunicationChannel): boolean {
    return channel === 'whatsapp';
  }

  async sendWhatsApp(phoneNumber: string, templateName: string, payload?: Record<string, any>): Promise<ProviderDeliveryResult> {
    return {
      success: true,
      status: 'queued',
      providerType: this.type,
      messageId: `local-wa-${Date.now()}`,
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
      message: 'Local WhatsApp provider is configured for local/development use.',
    };
  }
}

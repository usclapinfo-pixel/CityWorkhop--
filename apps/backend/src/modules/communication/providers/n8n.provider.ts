import { Injectable } from '@nestjs/common';
import { CommunicationChannel, IProviderAdapter, ProviderDeliveryResult, ProviderHealthStatus, ProviderType } from '../interfaces/provider.interface';

@Injectable()
export class N8nAutomationProvider implements IProviderAdapter {
  readonly type: ProviderType = 'N8N';

  supports(channel: CommunicationChannel): boolean {
    return channel === 'sms' || channel === 'whatsapp' || channel === 'email';
  }

  async sendOTP(phoneNumber: string, payload: Record<string, any>): Promise<ProviderDeliveryResult> {
    return {
      success: true,
      status: 'queued',
      providerType: this.type,
      messageId: `n8n-otp-${Date.now()}`,
      metadata: {
        phoneNumber,
        payload,
      },
    };
  }

  async getHealth(): Promise<ProviderHealthStatus> {
    return {
      isHealthy: true,
      lastChecked: new Date(),
      message: 'n8n automation adapter is available for orchestration workflows.',
    };
  }
}

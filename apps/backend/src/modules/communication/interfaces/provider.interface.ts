export type CommunicationChannel = 'sms' | 'whatsapp' | 'email';

export type ProviderType =
  | 'MSG91'
  | 'WHATSAPP'
  | 'LOCAL_WHATSAPP'
  | 'LOCAL_WHATSAPP_API'
  | 'WHATSAPP_BUSINESS_API'
  | 'N8N'
  | 'MANUAL'
  | 'TWILIO'
  | 'SENDGRID';

export interface ProviderHealthStatus {
  isHealthy: boolean;
  lastChecked?: Date;
  message?: string;
}

export interface ProviderDeliveryResult {
  success: boolean;
  messageId: string;
  status: string;
  providerType?: ProviderType;
  metadata?: Record<string, any>;
}

export interface IProviderAdapter {
  readonly type: ProviderType;
  supports(channel: CommunicationChannel): boolean;
  sendOTP?(phoneNumber: string, payload: Record<string, any>): Promise<ProviderDeliveryResult>;
  sendWhatsApp?(phoneNumber: string, templateName: string, payload?: Record<string, any>): Promise<ProviderDeliveryResult>;
  sendEmail?(to: string, subject: string, htmlBody: string, payload?: Record<string, any>): Promise<ProviderDeliveryResult>;
  getHealth?(): Promise<ProviderHealthStatus>;
}

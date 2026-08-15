/**
 * Communication Service Interface - Provider-independent abstraction
 * Implementations support:
 * - MSG91 (SMS, WhatsApp, OTP)
 * - Twilio (SMS)
 * - Sendgrid (Email)
 * - Local WhatsApp
 * - WhatsApp Business API
 * - Manual (admin-controlled)
 */
export interface ICommunicationService {
  // OTP
  sendOTP(phoneNumber: string, options?: { language?: string; channel?: 'sms' | 'whatsapp' }): Promise<{
    otpToken: string;
    expiresIn: number;
  }>;

  verifyOTP(otpToken: string, otp: string): Promise<boolean>;

  // WhatsApp
  sendWhatsAppMessage(phoneNumber: string, templateName: string, parameters?: Record<string, any>): Promise<{
    messageId: string;
    status: string;
  }>;

  // Magic Link
  sendMagicLink(email: string, link: string, language?: string): Promise<void>;

  // Email
  sendEmail(to: string, subject: string, htmlBody: string): Promise<void>;

  // SMS
  sendSMS(phoneNumber: string, message: string): Promise<void>;

  // Status
  getProviderStatus(): Promise<{
    isHealthy: boolean;
    lastChecked: Date;
    message?: string;
  }>;
}

/**
 * Response format for communication operations
 */
export interface CommunicationResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
  timestamp: Date;
}

export interface IIdempotencyStore {
  getCachedResponse(idempotencyKey: string): Promise<any | null>;
  cacheResponse(idempotencyKey: string, response: any, ttlSeconds?: number): Promise<void>;
  isProcessing(idempotencyKey: string): Promise<boolean>;
  markAsProcessing(idempotencyKey: string, ttlSeconds?: number): Promise<void>;
  clearProcessing(idempotencyKey: string): Promise<void>;
  generateDeduplicationId(phoneNumber: string, channel: 'sms' | 'whatsapp'): Promise<string>;
  checkOTPFloodProtection(phoneNumber: string, channel: 'sms' | 'whatsapp'): Promise<{
    allowed: boolean;
    secondsUntilNextAttempt: number;
  }>;
}

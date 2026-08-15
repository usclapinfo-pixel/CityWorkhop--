import { Injectable } from '@nestjs/common';
import { IIdempotencyStore } from '@common/interfaces/idempotency-store.interface';
import { MemoryIdempotencyStore } from './memory-idempotency.store';

/**
 * Idempotency Service - Prevents duplicate processing of requests.
 * This Phase 2A-safe implementation defaults to a memory-backed store and
 * can later be swapped for Redis without changing other application code.
 */
@Injectable()
export class IdempotencyService {
  private readonly store: IIdempotencyStore;

  constructor() {
    this.store = new MemoryIdempotencyStore();
  }

  async getCachedResponse(idempotencyKey: string): Promise<any | null> {
    return this.store.getCachedResponse(idempotencyKey);
  }

  async cacheResponse(idempotencyKey: string, response: any, ttlSeconds: number = 24 * 60 * 60): Promise<void> {
    return this.store.cacheResponse(idempotencyKey, response, ttlSeconds);
  }

  async isProcessing(idempotencyKey: string): Promise<boolean> {
    return this.store.isProcessing(idempotencyKey);
  }

  async markAsProcessing(idempotencyKey: string, ttlSeconds: number = 60): Promise<void> {
    return this.store.markAsProcessing(idempotencyKey, ttlSeconds);
  }

  async clearProcessing(idempotencyKey: string): Promise<void> {
    return this.store.clearProcessing(idempotencyKey);
  }

  async generateDeduplicationId(phoneNumber: string, channel: 'sms' | 'whatsapp'): Promise<string> {
    return this.store.generateDeduplicationId(phoneNumber, channel);
  }

  async checkOTPFloodProtection(phoneNumber: string, channel: 'sms' | 'whatsapp'): Promise<{
    allowed: boolean;
    secondsUntilNextAttempt: number;
  }> {
    return this.store.checkOTPFloodProtection(phoneNumber, channel);
  }
}

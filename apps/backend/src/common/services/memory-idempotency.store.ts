import { Injectable } from '@nestjs/common';
import { IIdempotencyStore } from '@common/interfaces/idempotency-store.interface';
import * as crypto from 'crypto';

@Injectable()
export class MemoryIdempotencyStore implements IIdempotencyStore {
  private readonly cache = new Map<string, { response: any; timestamp: number }>();

  async getCachedResponse(idempotencyKey: string): Promise<any | null> {
    if (!idempotencyKey) {
      return null;
    }

    const key = `idempotency:${this.hashKey(idempotencyKey)}`;
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
      return cached.response;
    }

    if (cached) {
      this.cache.delete(key);
    }

    return null;
  }

  async cacheResponse(idempotencyKey: string, response: any, ttlSeconds: number = 24 * 60 * 60): Promise<void> {
    if (!idempotencyKey) {
      return;
    }

    const key = `idempotency:${this.hashKey(idempotencyKey)}`;
    this.cache.set(key, { response, timestamp: Date.now() });
    setTimeout(() => this.cache.delete(key), ttlSeconds * 1000);
  }

  async isProcessing(idempotencyKey: string): Promise<boolean> {
    if (!idempotencyKey) {
      return false;
    }

    const key = `idempotency:processing:${this.hashKey(idempotencyKey)}`;
    return this.cache.has(key);
  }

  async markAsProcessing(idempotencyKey: string, ttlSeconds: number = 60): Promise<void> {
    if (!idempotencyKey) {
      return;
    }

    const key = `idempotency:processing:${this.hashKey(idempotencyKey)}`;
    this.cache.set(key, { response: true, timestamp: Date.now() });
    setTimeout(() => this.cache.delete(key), ttlSeconds * 1000);
  }

  async clearProcessing(idempotencyKey: string): Promise<void> {
    if (!idempotencyKey) {
      return;
    }

    this.cache.delete(`idempotency:processing:${this.hashKey(idempotencyKey)}`);
  }

  async generateDeduplicationId(phoneNumber: string, channel: 'sms' | 'whatsapp'): Promise<string> {
    const dedupeKey = `otp_dedup:${channel}:${phoneNumber}`;
    const cached = this.cache.get(dedupeKey);

    if (cached && Date.now() - cached.timestamp < 30 * 1000) {
      return cached.response;
    }

    const newId = crypto.randomUUID();
    this.cache.set(dedupeKey, { response: newId, timestamp: Date.now() });
    setTimeout(() => this.cache.delete(dedupeKey), 30 * 1000);
    return newId;
  }

  async checkOTPFloodProtection(phoneNumber: string, channel: 'sms' | 'whatsapp'): Promise<{
    allowed: boolean;
    secondsUntilNextAttempt: number;
  }> {
    const key = `otp_sent:${channel}:${phoneNumber}`;
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < 60 * 1000) {
      const secondsRemaining = Math.ceil((60 * 1000 - (now - cached.timestamp)) / 1000);
      return {
        allowed: false,
        secondsUntilNextAttempt: secondsRemaining,
      };
    }

    this.cache.set(key, { response: '1', timestamp: now });
    setTimeout(() => this.cache.delete(key), 60 * 1000);

    return {
      allowed: true,
      secondsUntilNextAttempt: 0,
    };
  }

  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }
}

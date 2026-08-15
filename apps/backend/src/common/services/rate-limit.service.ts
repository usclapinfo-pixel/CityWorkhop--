import { Injectable } from '@nestjs/common';
import { IRateLimitStore, RateLimitConfig } from '@common/interfaces/rate-limit-store.interface';
import { MemoryRateLimitStore } from './memory-rate-limit.store';

/**
 * Rate Limiting Service - Prevents brute-force attacks and DDoS.
 * This Phase 2A-safe implementation uses an in-memory provider by default.
 * Future distributed deployments can replace the store with a Redis adapter
 * without changing the business logic that calls this service.
 */
@Injectable()
export class RateLimitService {
  private readonly store: IRateLimitStore;

  constructor() {
    this.store = new MemoryRateLimitStore();
  }

  async isLimited(config: RateLimitConfig): Promise<boolean> {
    return this.store.isLimited(config);
  }

  async getRemaining(config: RateLimitConfig): Promise<number> {
    return this.store.getRemaining(config);
  }

  async getResetTime(config: RateLimitConfig): Promise<number> {
    return this.store.getResetTime(config);
  }

  async reset(key: string): Promise<void> {
    return this.store.reset(key);
  }

  async lockAccount(userId: string, durationMs: number = 15 * 60 * 1000): Promise<void> {
    return this.store.lockAccount(userId, durationMs);
  }

  async isAccountLocked(userId: string): Promise<boolean> {
    return this.store.isAccountLocked(userId);
  }

  async unlockAccount(userId: string): Promise<void> {
    return this.store.unlockAccount(userId);
  }

  async checkEndpointRateLimit(
    userId: string,
    endpoint: string,
    limit: number = 100,
    windowMs: number = 60 * 1000,
  ): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
    resetTime: number;
  }> {
    return this.store.checkEndpointRateLimit(userId, endpoint, limit, windowMs);
  }
}

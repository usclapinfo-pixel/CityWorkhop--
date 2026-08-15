import { Injectable } from '@nestjs/common';
import { IRateLimitStore, RateLimitConfig } from '@common/interfaces/rate-limit-store.interface';

@Injectable()
export class MemoryRateLimitStore implements IRateLimitStore {
  private readonly cache = new Map<string, { count: number; resetTime: number }>();

  async isLimited(config: RateLimitConfig): Promise<boolean> {
    const key = `rate_limit:${config.key}`;
    const now = Date.now();
    const entry = this.cache.get(key);

    if (!entry || now > entry.resetTime) {
      this.cache.set(key, { count: 1, resetTime: now + config.windowMs });
      return false;
    }

    entry.count += 1;
    return entry.count > config.limit;
  }

  async getRemaining(config: RateLimitConfig): Promise<number> {
    const key = `rate_limit:${config.key}`;
    const entry = this.cache.get(key);
    const now = Date.now();

    if (!entry || now > entry.resetTime) {
      return config.limit;
    }

    return Math.max(0, config.limit - entry.count);
  }

  async getResetTime(config: RateLimitConfig): Promise<number> {
    const key = `rate_limit:${config.key}`;
    const entry = this.cache.get(key);
    const now = Date.now();

    if (!entry || now > entry.resetTime) {
      return 0;
    }

    return Math.max(0, entry.resetTime - now);
  }

  async reset(key: string): Promise<void> {
    this.cache.delete(`rate_limit:${key}`);
  }

  async lockAccount(userId: string, durationMs: number = 15 * 60 * 1000): Promise<void> {
    this.cache.set(`account_lock:${userId}`, {
      count: 1,
      resetTime: Date.now() + durationMs,
    });
  }

  async isAccountLocked(userId: string): Promise<boolean> {
    const entry = this.cache.get(`account_lock:${userId}`);
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.resetTime) {
      this.cache.delete(`account_lock:${userId}`);
      return false;
    }

    return true;
  }

  async unlockAccount(userId: string): Promise<void> {
    this.cache.delete(`account_lock:${userId}`);
  }

  async checkEndpointRateLimit(
    userId: string,
    endpoint: string,
    limit: number = 100,
    windowMs: number = 60 * 1000,
  ): Promise<{ allowed: boolean; current: number; limit: number; resetTime: number }> {
    const key = `api_limit:${userId}:${endpoint}`;
    const now = Date.now();
    const entry = this.cache.get(key);

    let current = 1;
    let resetTime = now + windowMs;

    if (entry && now <= entry.resetTime) {
      current = entry.count + 1;
      resetTime = entry.resetTime;
    }

    this.cache.set(key, { count: current, resetTime });

    return {
      allowed: current <= limit,
      current,
      limit,
      resetTime: Math.max(0, resetTime - now),
    };
  }
}

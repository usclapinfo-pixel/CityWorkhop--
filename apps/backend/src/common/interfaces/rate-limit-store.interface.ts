export interface RateLimitConfig {
  key: string;
  limit: number;
  windowMs: number;
}

export interface IRateLimitStore {
  isLimited(config: RateLimitConfig): Promise<boolean>;
  getRemaining(config: RateLimitConfig): Promise<number>;
  getResetTime(config: RateLimitConfig): Promise<number>;
  reset(key: string): Promise<void>;
  lockAccount(userId: string, durationMs?: number): Promise<void>;
  isAccountLocked(userId: string): Promise<boolean>;
  unlockAccount(userId: string): Promise<void>;
  checkEndpointRateLimit(
    userId: string,
    endpoint: string,
    limit?: number,
    windowMs?: number,
  ): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
    resetTime: number;
  }>;
}

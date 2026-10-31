interface RateLimitEntry {
  tokens: number;
  lastRefillTimestamp: number;
}

export class TokenBucketRateLimiter {
  private readonly maxTokens: number;
  private readonly refillRatePerSecond: number;
  private readonly buckets = new Map<string, RateLimitEntry>();

  constructor(maxTokens: number = 20, refillTimeWindowSeconds: number = 60) {
    this.maxTokens = maxTokens;
    this.refillRatePerSecond = maxTokens / refillTimeWindowSeconds;
  }

  public check(ip: string): { allowed: boolean; remainingTokens: number; retryAfterSeconds: number } {
    const now = Date.now();
    let entry = this.buckets.get(ip);

    if (!entry) {
      entry = { tokens: this.maxTokens, lastRefillTimestamp: now };
      this.buckets.set(ip, entry);
    } else {
      // Refill tokens based on elapsed time
      const elapsedSeconds = (now - entry.lastRefillTimestamp) / 1000;
      const refilledTokens = elapsedSeconds * this.refillRatePerSecond;
      entry.tokens = Math.min(this.maxTokens, entry.tokens + refilledTokens);
      entry.lastRefillTimestamp = now;
    }

    if (entry.tokens >= 1) {
      entry.tokens -= 1;
      return {
        allowed: true,
        remainingTokens: Math.floor(entry.tokens),
        retryAfterSeconds: 0,
      };
    }

    // Rate limit exceeded: calculate wait time for at least 1 token
    const missingTokens = 1 - entry.tokens;
    const retryAfterSeconds = Math.ceil(missingTokens / this.refillRatePerSecond);

    return {
      allowed: false,
      remainingTokens: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }

  public reset(ip?: string): void {
    if (ip) {
      this.buckets.delete(ip);
    } else {
      this.buckets.clear();
    }
  }
}

export const globalAIRateLimiter = new TokenBucketRateLimiter(
  Number(process.env.RATE_LIMIT_MAX_REQUESTS_PER_MINUTE) || 20,
  60,
);

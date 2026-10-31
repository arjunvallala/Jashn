import crypto from 'crypto';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class InMemoryAICache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTtlMs: number;

  constructor(defaultTtlMs: number = 1000 * 60 * 30) {
    // 30 minutes default TTL
    this.defaultTtlMs = defaultTtlMs;
  }

  public static hashInput(input: unknown): string {
    const serialized = typeof input === 'string' ? input : JSON.stringify(input);
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  public set<T>(key: string, value: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
    this.cache.set(key, { value, expiresAt });
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }
}

export const globalAICache = new InMemoryAICache();

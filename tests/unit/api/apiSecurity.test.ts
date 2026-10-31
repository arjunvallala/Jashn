import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  parseAndValidateJsonBody,
  enforceAIRateLimit,
  getClientIP,
  MAX_BODY_BYTES,
} from '@/lib/apiSecurity';
import { globalAIRateLimiter } from '@/lib/rateLimiter';

describe('API Security, Rate Limiting & Payload Guards', () => {
  beforeEach(() => {
    globalAIRateLimiter.reset();
  });

  const testSchema = z.object({
    eventName: z.string().min(2).max(50),
    budget: z.number().int().positive(),
  });

  it('rejects payloads larger than 32KB with HTTP 413 Payload Too Large', async () => {
    const hugeString = 'A'.repeat(MAX_BODY_BYTES + 500);
    const body = JSON.stringify({ eventName: hugeString, budget: 1000 });

    const req = new NextRequest('http://localhost:3000/api/ai/plan', {
      method: 'POST',
      body,
      headers: {
        'content-type': 'application/json',
      },
    });

    const result = await parseAndValidateJsonBody(req, testSchema);
    expect(result.data).toBeNull();
    expect(result.errorResponse).not.toBeNull();
    expect(result.errorResponse!.status).toBe(413);
  });

  it('rejects invalid types and malformed schemas with HTTP 400 Bad Request', async () => {
    const req = new NextRequest('http://localhost:3000/api/ai/plan', {
      method: 'POST',
      body: JSON.stringify({ eventName: 12345, budget: 'not-a-number' }),
      headers: { 'content-type': 'application/json' },
    });

    const result = await parseAndValidateJsonBody(req, testSchema);
    expect(result.data).toBeNull();
    expect(result.errorResponse!.status).toBe(400);
  });

  it('enforces token-bucket rate limiting returning HTTP 429 with Retry-After header', () => {
    const limiter = globalAIRateLimiter;
    const testIp = '198.51.100.42';

    // Exhaust tokens (limit is 20)
    for (let i = 0; i < 20; i++) {
      const res = limiter.check(testIp);
      expect(res.allowed).toBe(true);
    }

    // 21st call must be rejected
    const blockedCheck = limiter.check(testIp);
    expect(blockedCheck.allowed).toBe(false);
    expect(blockedCheck.retryAfterSeconds).toBeGreaterThan(0);

    const req = new NextRequest('http://localhost:3000/api/ai/plan', {
      headers: { 'x-forwarded-for': testIp },
    });

    const rateLimitResponse = enforceAIRateLimit(req);
    expect(rateLimitResponse).not.toBeNull();
    expect(rateLimitResponse!.status).toBe(429);
    expect(rateLimitResponse!.headers.get('Retry-After')).toBeDefined();
  });

  it('extracts leftmost client IP from multi-hop x-forwarded-for header', () => {
    const req = new NextRequest('http://localhost:3000/api/ai/plan', {
      headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178' },
    });

    expect(getClientIP(req)).toBe('203.0.113.195');
  });
});

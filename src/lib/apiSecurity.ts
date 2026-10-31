import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { globalAIRateLimiter } from './rateLimiter';
import { SafeLogger } from './logger';

export const MAX_BODY_BYTES = 32 * 1024; // 32KB payload limit

export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',');
    const clientIp = parts[0]?.trim();
    if (clientIp) return clientIp;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

export async function parseAndValidateJsonBody<T>(
  req: NextRequest,
  schema: z.ZodType<T>,
): Promise<{ data: T; errorResponse: null } | { data: null; errorResponse: NextResponse }> {
  // Check Content-Length if present
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return {
      data: null,
      errorResponse: NextResponse.json(
        { error: 'Payload Too Large', message: 'Request payload exceeds the 32KB safety limit.' },
        { status: 413 },
      ),
    };
  }

  // Read raw text with byte length check
  let bodyText: string;
  try {
    bodyText = await req.text();
  } catch {
    return {
      data: null,
      errorResponse: NextResponse.json(
        { error: 'Bad Request', message: 'Unable to read request payload.' },
        { status: 400 },
      ),
    };
  }

  const byteLength = Buffer.byteLength(bodyText, 'utf8');
  if (byteLength > MAX_BODY_BYTES) {
    return {
      data: null,
      errorResponse: NextResponse.json(
        { error: 'Payload Too Large', message: 'Request payload exceeds the 32KB safety limit.' },
        { status: 413 },
      ),
    };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(bodyText);
  } catch {
    return {
      data: null,
      errorResponse: NextResponse.json(
        { error: 'Bad Request', message: 'Invalid JSON format.' },
        { status: 400 },
      ),
    };
  }

  const validationResult = schema.safeParse(parsedJson);
  if (!validationResult.success) {
    const formattedErrors = validationResult.error.issues.map(i => ({
      path: i.path.join('.'),
      message: i.message,
    }));

    return {
      data: null,
      errorResponse: NextResponse.json(
        {
          error: 'Validation Error',
          message: 'The submitted request does not satisfy parameter requirements.',
          details: formattedErrors,
        },
        { status: 400 },
      ),
    };
  }

  return {
    data: validationResult.data,
    errorResponse: null,
  };
}

export function enforceAIRateLimit(req: NextRequest): NextResponse | null {
  const ip = getClientIP(req);
  const check = globalAIRateLimiter.check(ip);

  if (!check.allowed) {
    SafeLogger.warn(`Rate limit exceeded for IP`, { ip });
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'AI request limit reached. Please wait before submitting another request.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(check.retryAfterSeconds),
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  return null;
}

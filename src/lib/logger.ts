export class SafeLogger {
  private static redactSensitiveData(data: unknown): unknown {
    if (typeof data === 'string') {
      // Redact potential emails, phones, tokens, API keys
      return data
        .replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, '[EMAIL_REDACTED]')
        .replace(/(?:\+?\d{1,3}[\s-]?)?(?:\d{5}[\s-]?\d{5}|\d{4}[\s-]?\d{3}[\s-]?\d{3}|\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|\b[6-9]\d{9}\b)/g, '[PHONE_REDACTED]')
        .replace(/(?:AIzaSy|key-)[a-zA-Z0-9_-]{20,}/g, '[API_KEY_REDACTED]');
    }

    if (Array.isArray(data)) {
      return data.map(item => this.redactSensitiveData(item));
    }

    if (data !== null && typeof data === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
        if (/password|token|key|secret|email|phone|authorization/i.test(key)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.redactSensitiveData(val);
        }
      }
      return sanitized;
    }

    return data;
  }

  public static info(message: string, context?: Record<string, unknown>): void {
    const sanitizedCtx = context ? this.redactSensitiveData(context) : undefined;
    console.info(`[INFO] ${new Date().toISOString()} - ${message}`, sanitizedCtx ?? '');
  }

  public static warn(message: string, context?: Record<string, unknown>): void {
    const sanitizedCtx = context ? this.redactSensitiveData(context) : undefined;
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, sanitizedCtx ?? '');
  }

  public static error(message: string, error?: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const safeError = this.redactSensitiveData(errorMessage);
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}: ${safeError}`);
  }
}

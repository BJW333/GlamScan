import { db } from "./db";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: Request) => string; // Custom key generator
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
}

// In-memory store for rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async checkLimit(request: Request, identifier?: string): Promise<RateLimitResult> {
    const key = identifier || this.config.keyGenerator?.(request) || this.getDefaultKey(request);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Clean up expired entries
    this.cleanup(windowStart);

    const current = rateLimitStore.get(key);
    const resetTime = new Date(now + this.config.windowMs);

    if (!current || current.resetTime <= now) {
      // First request in window or window expired
      rateLimitStore.set(key, { count: 1, resetTime: resetTime.getTime() });
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime,
      };
    }

    if (current.count >= this.config.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(current.resetTime),
      };
    }

    // Increment counter
    current.count++;
    rateLimitStore.set(key, current);

    return {
      allowed: true,
      remaining: this.config.maxRequests - current.count,
      resetTime: new Date(current.resetTime),
    };
  }

  private getDefaultKey(request: Request): string {
    // Extract IP from various headers (considering proxies)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0] || realIp || 'unknown';
    return `rate_limit:${ip}`;
  }

  private cleanup(windowStart: number): void {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime <= windowStart) {
        rateLimitStore.delete(key);
      }
    }
  }
}

// Pre-configured rate limiters for different endpoints
export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes for auth endpoints
});

export const generalRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute for general endpoints
});

export const postRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 posts per minute
});

export const messageRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 messages per minute
});
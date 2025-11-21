import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export interface RateLimitConfig {
  ttl: number; // Time window in seconds
  limit: number; // Max requests per window
}

// In-memory store for rate limiting (production should use Redis)
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  increment(key: string, ttl: number): { count: number; resetTime: number } {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing || now > existing.resetTime) {
      // Create new window
      const resetTime = now + ttl * 1000;
      this.store.set(key, { count: 1, resetTime });
      return { count: 1, resetTime };
    }

    // Increment existing window
    existing.count++;
    this.store.set(key, existing);
    return existing;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly store = new RateLimitStore();
  private readonly defaultConfig: RateLimitConfig = {
    ttl: 60, // 1 minute
    limit: 100, // 100 requests per minute
  };

  constructor(private reflector: Reflector) {
    // Clean up expired entries every 5 minutes
    setInterval(() => this.store.cleanup(), 5 * 60 * 1000);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Get rate limit config from decorator or use default
    const config =
      this.reflector.get<RateLimitConfig>('rateLimit', context.getHandler()) || this.defaultConfig;

    // Generate key from IP and user ID (if authenticated)
    const ip = this.getClientIp(request);
    const userId = request.user?.id || 'anonymous';
    const key = `rate-limit:${ip}:${userId}`;

    // Check rate limit
    const { count, resetTime } = this.store.increment(key, config.ttl);

    // Set rate limit headers
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', config.limit);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, config.limit - count));
    response.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));

    if (count > config.limit) {
      this.logger.warn(`Rate limit exceeded for ${key}: ${count}/${config.limit}`);
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      response.setHeader('Retry-After', retryAfter);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests, please try again later',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }
}

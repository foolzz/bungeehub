import { SetMetadata } from '@nestjs/common';
import { RateLimitConfig } from '../guards/rate-limit.guard';

export const RATE_LIMIT_KEY = 'rateLimit';

/**
 * Apply rate limiting to a route
 * @param config Rate limit configuration
 * @example
 * @RateLimit({ ttl: 60, limit: 10 }) // 10 requests per minute
 */
export const RateLimit = (config: RateLimitConfig) => SetMetadata(RATE_LIMIT_KEY, config);

/**
 * Strict rate limit for sensitive endpoints
 * 5 requests per minute
 */
export const StrictRateLimit = () => RateLimit({ ttl: 60, limit: 5 });

/**
 * Moderate rate limit for normal endpoints
 * 30 requests per minute
 */
export const ModerateRateLimit = () => RateLimit({ ttl: 60, limit: 30 });

/**
 * Lenient rate limit for public endpoints
 * 100 requests per minute
 */
export const LenientRateLimit = () => RateLimit({ ttl: 60, limit: 100 });

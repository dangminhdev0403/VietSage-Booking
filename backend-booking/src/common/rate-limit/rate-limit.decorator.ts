import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'RATE_LIMIT_KEY';

export interface RateLimitOptions {
  /** Maximum number of requests allowed within the window */
  points: number;
  /** Window duration in seconds */
  duration: number;
  /** Custom key prefix for categorizing endpoints (e.g. 'auth:login', 'booking:create') */
  keyPrefix?: string;
  /** Custom message when limit is exceeded */
  errorMessage?: string;
}

/**
 * Decorator to apply rate limiting to a controller class or individual route handler.
 * Example: @RateLimit({ points: 5, duration: 60, keyPrefix: 'auth:login' })
 */
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { RATE_LIMIT_KEY, type RateLimitOptions } from './rate-limit.decorator';
import { RateLimiterService } from './rate-limiter.service';

function resolveClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimiter: RateLimiterService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const handler = context.getHandler();
    const classRef = context.getClass();

    // Check handler first, fallback to controller class
    const options =
      this.reflector.get<RateLimitOptions>(RATE_LIMIT_KEY, handler) ||
      this.reflector.get<RateLimitOptions>(RATE_LIMIT_KEY, classRef);

    // If no rate limit specified on handler or class, pass through
    if (!options) {
      return true;
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request & { user?: { id?: string } }>();
    const res = http.getResponse<Response>();

    const ip = resolveClientIp(req);
    const userId = req.user?.id ? `:usr_${req.user.id}` : '';
    const prefix = options.keyPrefix || `${classRef.name}:${handler.name}`;
    const key = `${prefix}:${ip}${userId}`;

    const result = this.rateLimiter.consume(
      key,
      options.points,
      options.duration,
    );

    // Set standard rate limit headers when response is available
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('X-RateLimit-Limit', options.points);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTimeMs / 1000));
    }

    if (!result.isAllowed) {
      if (res && typeof res.setHeader === 'function') {
        res.setHeader('Retry-After', result.retryAfterSeconds);
      }

      const message =
        options.errorMessage ||
        `Quá nhiều yêu cầu từ địa chỉ của bạn. Vui lòng thử lại sau ${result.retryAfterSeconds} giây.`;

      throw new HttpException(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message,
            retry_after: result.retryAfterSeconds,
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}

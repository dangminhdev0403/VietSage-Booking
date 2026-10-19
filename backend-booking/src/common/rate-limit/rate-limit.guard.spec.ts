import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimiterService } from './rate-limiter.service';
import { RATE_LIMIT_KEY, type RateLimitOptions } from './rate-limit.decorator';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let reflector: Reflector;
  let service: RateLimiterService;

  beforeEach(() => {
    reflector = new Reflector();
    service = new RateLimiterService();
    guard = new RateLimitGuard(reflector, service);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  function createMockContext(options?: {
    handlerOptions?: RateLimitOptions;
    ip?: string;
    userId?: string;
  }): ExecutionContext {
    const handler = () => {};
    class TestController {}

    if (options?.handlerOptions) {
      Reflect.defineMetadata(RATE_LIMIT_KEY, options.handlerOptions, handler);
    }

    const headers: Record<string, string> = {};
    if (options?.ip) {
      headers['x-forwarded-for'] = options.ip;
    }

    const mockRequest = {
      headers,
      ip: options?.ip || '127.0.0.1',
      user: options?.userId ? { id: options.userId } : undefined,
    };

    const setHeaders: Record<string, unknown> = {};
    const mockResponse = {
      setHeader: (name: string, value: unknown) => {
        setHeaders[name] = value;
      },
    };

    return {
      getHandler: () => handler,
      getClass: () => TestController,
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext;
  }

  it('allows request when no RateLimit decorator is present', () => {
    const context = createMockContext();
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows request within limit and sets response headers', () => {
    const context = createMockContext({
      handlerOptions: { points: 2, duration: 60, keyPrefix: 'test' },
      ip: '10.0.0.1',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws 429 when rate limit is exceeded', () => {
    const context = createMockContext({
      handlerOptions: { points: 1, duration: 60, keyPrefix: 'test:exceed' },
      ip: '10.0.0.2',
    });

    expect(guard.canActivate(context)).toBe(true);

    try {
      guard.canActivate(context);
      fail('Expected HttpException 429');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(HttpException);
      const httpErr = err as HttpException;
      expect(httpErr.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      const resp = httpErr.getResponse() as {
        success: boolean;
        error: { code: string; retry_after: number };
      };
      expect(resp.success).toBe(false);
      expect(resp.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(resp.error.retry_after).toBeGreaterThanOrEqual(1);
    }
  });
});

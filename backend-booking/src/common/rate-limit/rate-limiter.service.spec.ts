import { RateLimiterService } from './rate-limiter.service';

describe('RateLimiterService', () => {
  let service: RateLimiterService;

  beforeEach(() => {
    service = new RateLimiterService();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('allows requests within the limit', () => {
    const key = 'test:key:1';
    const res1 = service.consume(key, 3, 60);
    expect(res1.isAllowed).toBe(true);
    expect(res1.remaining).toBe(2);
    expect(res1.totalHits).toBe(1);

    const res2 = service.consume(key, 3, 60);
    expect(res2.isAllowed).toBe(true);
    expect(res2.remaining).toBe(1);
    expect(res2.totalHits).toBe(2);

    const res3 = service.consume(key, 3, 60);
    expect(res3.isAllowed).toBe(true);
    expect(res3.remaining).toBe(0);
    expect(res3.totalHits).toBe(3);
  });

  it('rejects requests exceeding the limit', () => {
    const key = 'test:key:exceed';
    service.consume(key, 2, 60);
    service.consume(key, 2, 60);

    const res = service.consume(key, 2, 60);
    expect(res.isAllowed).toBe(false);
    expect(res.remaining).toBe(0);
    expect(res.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });

  it('resets correctly when resetAll is invoked', () => {
    const key = 'test:key:reset';
    service.consume(key, 1, 60);
    expect(service.consume(key, 1, 60).isAllowed).toBe(false);

    service.resetAll();
    expect(service.consume(key, 1, 60).isAllowed).toBe(true);
  });
});

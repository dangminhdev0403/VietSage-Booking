import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

export interface RateLimitResult {
  isAllowed: boolean;
  totalHits: number;
  remaining: number;
  resetTimeMs: number;
  retryAfterSeconds: number;
}

@Injectable()
export class RateLimiterService implements OnModuleDestroy {
  private readonly logger = new Logger(RateLimiterService.name);
  // Store: key -> array of request timestamps (epoch ms)
  private readonly hits = new Map<string, number[]>();
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Periodic sweep every 60s to purge stale keys and prevent memory growth
    this.cleanupInterval = setInterval(() => {
      this.purgeStaleEntries();
    }, 60_000);
    // Unref so this timer doesn't prevent Node process from gracefully exiting
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  onModuleDestroy() {
    clearInterval(this.cleanupInterval);
  }

  /**
   * Consume 1 point for a given key under sliding window parameters.
   * @param key Identifier (e.g. `auth:login:127.0.0.1`)
   * @param points Maximum allowed requests
   * @param durationSeconds Window length in seconds
   */
  consume(
    key: string,
    points: number,
    durationSeconds: number,
  ): RateLimitResult {
    const now = Date.now();
    const windowStart = now - durationSeconds * 1000;

    let timestamps = this.hits.get(key);
    if (!timestamps) {
      timestamps = [];
      this.hits.set(key, timestamps);
    }

    // Filter out timestamps outside the active window
    const validTimestamps = timestamps.filter((t) => t > windowStart);

    if (validTimestamps.length >= points) {
      // Limit exceeded: calculate reset time from the oldest timestamp in window
      const oldestInWindow = validTimestamps[0] ?? now;
      const resetTimeMs = oldestInWindow + durationSeconds * 1000;
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((resetTimeMs - now) / 1000),
      );

      // Keep valid timestamps in map
      this.hits.set(key, validTimestamps);

      return {
        isAllowed: false,
        totalHits: validTimestamps.length,
        remaining: 0,
        resetTimeMs,
        retryAfterSeconds,
      };
    }

    // Allowed: record current hit
    validTimestamps.push(now);
    this.hits.set(key, validTimestamps);

    const oldestInWindow = validTimestamps[0] ?? now;
    const resetTimeMs = oldestInWindow + durationSeconds * 1000;
    const remaining = Math.max(0, points - validTimestamps.length);

    return {
      isAllowed: true,
      totalHits: validTimestamps.length,
      remaining,
      resetTimeMs,
      retryAfterSeconds: 0,
    };
  }

  /**
   * Clear all records (useful in tests)
   */
  resetAll(): void {
    this.hits.clear();
  }

  /**
   * Remove keys whose timestamps are all expired
   */
  private purgeStaleEntries(): void {
    const now = Date.now();
    let purgedCount = 0;

    for (const [key, timestamps] of this.hits.entries()) {
      // If the latest hit is older than 5 minutes, delete the entry entirely
      const latestHit = timestamps[timestamps.length - 1];
      if (!latestHit || now - latestHit > 300_000) {
        this.hits.delete(key);
        purgedCount++;
      }
    }

    if (purgedCount > 0) {
      this.logger.debug(
        `Purged ${purgedCount} stale rate limit tracking entries`,
      );
    }
  }
}

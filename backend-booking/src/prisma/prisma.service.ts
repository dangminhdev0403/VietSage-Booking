import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

const SLOW_QUERY_THRESHOLD_MS = 250;

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query' | 'warn' | 'error'>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    // Telemetry: Alert on slow queries exceeding threshold
    this.$on('query', (e) => {
      if (e.duration >= SLOW_QUERY_THRESHOLD_MS) {
        this.logger.warn(
          `[Slow Query Alert] ${e.duration}ms: ${e.query.slice(0, 250)}`,
        );
      }
    });

    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

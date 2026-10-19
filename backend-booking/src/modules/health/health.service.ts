import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface HealthResponse {
  status: 'ok';
  service: string;
  uptimeSeconds: number;
  timestamp: string;
}

export interface ReadinessResponse {
  status: 'ready';
  service: string;
  dependencies: { database: 'up' };
  timestamp: string;
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'booking-backend',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness(): Promise<ReadinessResponse> {
    try {
      await this.prisma.$queryRaw(Prisma.sql`SELECT 1 AS ready`);
    } catch {
      throw new ServiceUnavailableException('Database dependency is unavailable');
    }

    return {
      status: 'ready',
      service: 'booking-backend',
      dependencies: { database: 'up' },
      timestamp: new Date().toISOString(),
    };
  }
}

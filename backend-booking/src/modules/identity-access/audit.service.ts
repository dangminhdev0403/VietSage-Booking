import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type CreateAuditEventParams = {
  actorId: string;
  action: string;
  boundedContext: string;
  resourceType: string;
  resourceId: string;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logEvent(params: CreateAuditEventParams): Promise<void> {
    try {
      await this.prisma.auditEvent.create({
        data: {
          actorId: params.actorId,
          action: params.action,
          boundedContext: params.boundedContext,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          metadata: params.metadata ?? {},
        },
      });
    } catch (error) {
      this.logger.error('Failed to persist audit event', error);
    }
  }
}

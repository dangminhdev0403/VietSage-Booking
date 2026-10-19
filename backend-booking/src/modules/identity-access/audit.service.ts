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

  async resolveActorId(
    actorId?: string,
  ): Promise<{ resolvedId: string; isFallback: boolean; originalActor?: string } | null> {
    if (
      actorId &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actorId)
    ) {
      try {
        const existing = await this.prisma.account.findUnique({
          where: { id: actorId },
          select: { id: true },
        });
        if (existing) {
          return { resolvedId: existing.id, isFallback: false };
        }
      } catch (err) {
        this.logger.debug(`Could not verify account by ID: ${err}`);
      }
    }

    // Fallback to system / admin account for anonymous / guest actors to satisfy FK constraint actorId -> Account(id)
    try {
      const systemAccount = await this.prisma.account.findFirst({
        where: { OR: [{ username: 'admin' }, { role: 'ADMIN' }] },
        select: { id: true },
      });
      if (systemAccount) {
        return {
          resolvedId: systemAccount.id,
          isFallback: true,
          originalActor: actorId || 'ANONYMOUS_GUEST',
        };
      }

      const anyAccount = await this.prisma.account.findFirst({
        select: { id: true },
      });
      if (anyAccount) {
        return {
          resolvedId: anyAccount.id,
          isFallback: true,
          originalActor: actorId || 'ANONYMOUS_GUEST',
        };
      }
    } catch (err) {
      this.logger.debug(`Could not find fallback system account: ${err}`);
    }

    return null;
  }

  async logEvent(params: CreateAuditEventParams): Promise<void> {
    try {
      const resolved = await this.resolveActorId(params.actorId);
      if (!resolved) {
        this.logger.warn(
          `[Audit] Cannot persist audit event (${params.action}) on ${params.resourceType}:${params.resourceId}: No valid Account found in database to satisfy foreign key constraint. Original actor: ${params.actorId}`,
        );
        return;
      }

      let metadataObj: Record<string, unknown> = {};
      if (
        params.metadata &&
        typeof params.metadata === 'object' &&
        !Array.isArray(params.metadata)
      ) {
        metadataObj = { ...(params.metadata as Record<string, unknown>) };
      }
      if (resolved.isFallback) {
        metadataObj.originalActor = resolved.originalActor;
        metadataObj.isGuestAction = true;
      }

      await this.prisma.auditEvent.create({
        data: {
          actorId: resolved.resolvedId,
          action: params.action,
          boundedContext: params.boundedContext,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          metadata: metadataObj as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      this.logger.error(
        `[Audit] Failed to persist audit event (${params.action}) on ${params.resourceType}:${params.resourceId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}

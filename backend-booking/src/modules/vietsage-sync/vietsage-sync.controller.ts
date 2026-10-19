import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import {
  VietSageSyncService,
  verifyHmacSignature,
} from './vietsage-sync.service';
import { ok } from '../../common/http/api-response';
import { RequirePermission } from '../../common/auth/require-permission.decorator';
import { Public } from '../../common/auth/public.decorator';

const ALLOWED_SYNC_TYPES = ['all', 'inventory', 'rates', 'properties'];

const inventoryAdjustmentItemSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày phải là YYYY-MM-DD'),
  available_rooms: z.number().int().min(0).optional(),
  total_rooms: z.number().int().min(0).optional(),
  booked_rooms: z.number().int().min(0).optional(),
  price: z.number().int().min(0).optional(),
  is_blocked: z.boolean().optional(),
});

const inventoryUpdateWebhookSchema = z.object({
  property_id: z.string().min(1, 'property_id là bắt buộc'),
  room_type_id: z.string().min(1, 'room_type_id là bắt buộc'),
  adjustments: z
    .array(inventoryAdjustmentItemSchema)
    .min(1, 'adjustments không được rỗng'),
});

@Controller('api/v1/vietsage')
export class VietSageSyncController {
  constructor(private readonly syncService: VietSageSyncService) {}

  @RequirePermission('sync:reconcile')
  @Post('sync')
  async sync(@Body() body?: { sync_type?: string }) {
    const syncType = body?.sync_type || 'all';
    if (!ALLOWED_SYNC_TYPES.includes(syncType)) {
      throw new BadRequestException(
        `sync_type '${syncType}' không được hỗ trợ`,
      );
    }

    const data = await this.syncService.syncFromVietSage(syncType);
    return ok(data);
  }

  @Public()
  @Post('webhook/inventory-updated')
  @HttpCode(HttpStatus.OK)
  async handleInventoryUpdated(
    @Headers('x-signature') sigHeader: string | undefined,
    @Headers('x-signature-v1') sigV1Header: string | undefined,
    @Headers('x-timestamp') timestampHeader: string | undefined,
    @Headers('x-request-id') requestIdHeader: string | undefined,
    @Body() rawBody: unknown,
    @Req() req: Request & { rawBody?: Buffer | string },
  ) {
    const signatureHeader = sigHeader || sigV1Header || '';
    const timestamp = timestampHeader
      ? parseInt(timestampHeader, 10)
      : undefined;
    const requestId =
      requestIdHeader ||
      (req?.headers && (req.headers['x-request-id'] as string)) ||
      '';
    const path =
      req?.path ||
      req?.originalUrl?.split('?')[0] ||
      '/api/v1/vietsage/webhook/inventory-updated';

    verifyHmacSignature({
      method: 'POST',
      path,
      timestamp,
      requestId,
      body: rawBody,
      signatureHeader,
      secret: this.syncService.getHmacSecret(),
    });

    const parsed = inventoryUpdateWebhookSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dữ liệu điều chỉnh tồn kho không hợp lệ',
        details: parsed.error.issues,
      });
    }

    const result = await this.syncService.processInventoryAdjustments(
      parsed.data,
    );
    return ok(result);
  }
}

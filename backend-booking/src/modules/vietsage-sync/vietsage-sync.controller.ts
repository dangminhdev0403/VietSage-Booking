import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { VietSageSyncService } from './vietsage-sync.service';
import { ok } from '../../common/http/api-response';
import { RequireRole } from '../../common/auth/require-role.decorator';
import { PermissionGuard } from '../../common/auth/permission.guard';

const ALLOWED_SYNC_TYPES = ['all', 'inventory', 'rates', 'properties'];

@Controller('api/v1/vietsage')
export class VietSageSyncController {
  constructor(private readonly syncService: VietSageSyncService) {}

  @RequireRole('ADMIN')
  @UseGuards(PermissionGuard)
  @Post('sync')
  async sync(@Body() body?: { sync_type?: string }) {
    const syncType = body?.sync_type || 'all';
    if (!ALLOWED_SYNC_TYPES.includes(syncType)) {
      throw new BadRequestException(`sync_type '${syncType}' không được hỗ trợ`);
    }

    const data = await this.syncService.syncFromVietSage(syncType);
    return ok(data);
  }
}

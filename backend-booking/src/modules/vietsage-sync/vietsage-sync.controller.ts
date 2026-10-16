import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { VietSageSyncService } from './vietsage-sync.service';
import { ok } from '../../common/http/api-response';
import { JwtAuthenticationGuard } from '../../common/auth/jwt-authentication.guard';
import { RequireRole } from '../../common/auth/require-role.decorator';
import { PermissionGuard } from '../../common/auth/permission.guard';

import { Public } from '../../common/auth/public.decorator';

@Controller('api/v1/vietsage')
export class VietSageSyncController {
  constructor(private readonly syncService: VietSageSyncService) {}

  @Public()
  @Post('sync')

  async sync(@Body() body: { sync_type?: string }) {
    const data = await this.syncService.syncFromVietSage(body?.sync_type);
    return ok(data);
  }
}

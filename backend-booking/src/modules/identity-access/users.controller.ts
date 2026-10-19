import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ok } from '../../common/http/api-response';
import { RequirePermission } from '../../common/auth/require-permission.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthenticationGuard } from '../../common/auth/jwt-authentication.guard';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import type {
  ApprovePartnerDto,
  ListUsersQueryDto,
  UpdateUserRoleDto,
} from './dto/auth.dto';
import { RateLimit } from '../../common/rate-limit/rate-limit.decorator';

@Controller('api/v1/admin/users')
@UseGuards(JwtAuthenticationGuard)
@RequirePermission('admin:access')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RateLimit({ points: 30, duration: 60, keyPrefix: 'admin:users:list' })
  async listUsers(@Query() query: ListUsersQueryDto) {
    const data = await this.usersService.listUsers(query);
    return ok(data);
  }

  @Post(':id/approve-partner')
  @RateLimit({ points: 20, duration: 60, keyPrefix: 'admin:users:approve' })
  async approvePartner(
    @Param('id') id: string,
    @Body() body: ApprovePartnerDto,
    @CurrentUser() adminUser: AuthenticatedUser,
  ) {
    const data = await this.usersService.approvePartner(id, body, adminUser);
    return ok(data);
  }

  @Put(':id/role')
  @RateLimit({ points: 20, duration: 60, keyPrefix: 'admin:users:role' })
  async updateUserRole(
    @Param('id') id: string,
    @Body() body: UpdateUserRoleDto,
    @CurrentUser() adminUser: AuthenticatedUser,
  ) {
    const data = await this.usersService.updateUserRole(id, body, adminUser);
    return ok(data);
  }
}

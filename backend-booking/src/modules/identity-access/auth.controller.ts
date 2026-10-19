import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ok } from '../../common/http/api-response';
import { Public } from '../../common/auth/public.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { AllowAuthenticated } from '../../common/auth/allow-authenticated.decorator';
import { JwtAuthenticationGuard } from '../../common/auth/jwt-authentication.guard';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { LocalAuthGuard } from './local-auth.guard';
import type {
  ChangePasswordDto,
  RefreshDto,
  RegisterDto,
  UpdateProfileDto,
} from './dto/auth.dto';
import type { Account } from '@prisma/client';

import { RateLimit } from '../../common/rate-limit/rate-limit.decorator';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @RateLimit({
    points: 5,
    duration: 60,
    keyPrefix: 'auth:register',
    errorMessage:
      'Quá nhiều yêu cầu tạo tài khoản từ địa chỉ của bạn. Vui lòng thử lại sau 1 phút.',
  })
  @Post('register')
  async register(@Body() body: RegisterDto) {
    const data = await this.authService.register(body);
    return ok(data);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @RateLimit({
    points: 5,
    duration: 60,
    keyPrefix: 'auth:login',
    errorMessage:
      'Quá nhiều lần thử đăng nhập không thành công. Vui lòng thử lại sau 1 phút.',
  })
  @Post('login')
  async login(@Request() req: { user: Account }) {
    const data = await this.authService.loginWithValidatedUser(req.user);
    return ok(data);
  }

  @Public()
  @RateLimit({ points: 20, duration: 60, keyPrefix: 'auth:refresh' })
  @Post('refresh')
  async refresh(@Body() body: RefreshDto) {
    const data = await this.authService.refresh(body);
    return ok(data);
  }

  @UseGuards(JwtAuthenticationGuard)
  @AllowAuthenticated()
  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.authService.getProfile(user.id);
    return ok(data);
  }

  @UseGuards(JwtAuthenticationGuard)
  @AllowAuthenticated()
  @Put('profile')
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateProfileDto,
  ) {
    const data = await this.authService.updateProfile(user.id, body);
    return ok(data);
  }

  @UseGuards(JwtAuthenticationGuard)
  @AllowAuthenticated()
  @Put('change-password')
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ChangePasswordDto,
  ) {
    const data = await this.authService.changePassword(user.id, body);
    return ok(data);
  }
}

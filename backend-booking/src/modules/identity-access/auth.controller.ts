import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ok } from '../../common/http/api-response';
import { Public } from '../../common/auth/public.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthenticationGuard } from '../../common/auth/jwt-authentication.guard';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { LocalAuthGuard } from './local-auth.guard';
import type { LoginDto, RefreshDto, RegisterDto } from './dto/auth.dto';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() body: RegisterDto) {
    const data = await this.authService.register(body);
    return ok(data);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: any, @Body() _body: LoginDto) {
    const data = await this.authService.loginWithValidatedUser(req.user);
    return ok(data);
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() body: RefreshDto) {
    const data = await this.authService.refresh(body);
    return ok(data);
  }

  @UseGuards(JwtAuthenticationGuard)
  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.authService.getProfile(user.id);
    return ok(data);
  }
}

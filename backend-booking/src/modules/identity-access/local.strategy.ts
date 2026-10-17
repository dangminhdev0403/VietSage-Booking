import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import type { Account } from '@prisma/client';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
    });
  }

  async validate(username: string, pass: string): Promise<Account> {
    const user = await this.authService.validateUser(username, pass);
    if (!user) {
      throw new UnauthorizedException(
        'Tên đăng nhập hoặc mật khẩu không chính xác',
      );
    }
    return user;
  }
}

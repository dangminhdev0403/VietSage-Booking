import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { AuditService } from './audit.service';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { getRuntimeSecret } from '../../common/config/runtime-config';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: getRuntimeSecret(
        'JWT_SECRET',
        'booking-manager-development-secret-key-2026',
      ),
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController, UsersController],
  providers: [
    AuthService,
    UsersService,
    JwtStrategy,
    LocalStrategy,
    AuditService,
  ],
  exports: [AuthService, UsersService, AuditService],
})
export class IdentityAccessModule {}

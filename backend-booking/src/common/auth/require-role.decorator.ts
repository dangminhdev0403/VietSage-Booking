import { SetMetadata } from '@nestjs/common';
import { REQUIRED_ROLES_KEY } from './auth.constants';

export const RequireRole = (...roles: string[]) =>
  SetMetadata(REQUIRED_ROLES_KEY, roles);

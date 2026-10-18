import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from './permission.guard';
import { IS_PUBLIC_KEY, REQUIRED_PERMISSIONS_KEY } from './auth.constants';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new PermissionGuard(reflector);
  });

  const createMockContext = (user?: any): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('allows public routes unconditionally', () => {
    reflector.getAllAndOverride.mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return true;
      return undefined;
    });

    const ctx = createMockContext(undefined);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects unauthenticated requests on protected routes', () => {
    reflector.getAllAndOverride.mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      return undefined;
    });

    const ctx = createMockContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('allows authenticated requests when no specific permissions are required', () => {
    reflector.getAllAndOverride.mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === REQUIRED_PERMISSIONS_KEY) return [];
      return undefined;
    });

    const ctx = createMockContext({ id: 'u1', permissions: [] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows requests when user holds exact required permission', () => {
    reflector.getAllAndOverride.mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === REQUIRED_PERMISSIONS_KEY) return ['catalog:read'];
      return undefined;
    });

    const ctx = createMockContext({
      id: 'u1',
      permissions: ['catalog:read', 'bookings:read'],
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows requests when user holds global wildcard permission', () => {
    reflector.getAllAndOverride.mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === REQUIRED_PERMISSIONS_KEY) return ['any:secret:permission'];
      return undefined;
    });

    const ctx = createMockContext({
      id: 'u-admin',
      permissions: ['*'],
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows requests when user holds domain wildcard permission', () => {
    reflector.getAllAndOverride.mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === REQUIRED_PERMISSIONS_KEY) return ['allotments:manage'];
      return undefined;
    });

    const ctx = createMockContext({
      id: 'u-partner',
      permissions: ['allotments:*'],
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects requests when user is missing required permission', () => {
    reflector.getAllAndOverride.mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === REQUIRED_PERMISSIONS_KEY) return ['payments:manage'];
      return undefined;
    });

    const ctx = createMockContext({
      id: 'u-staff',
      permissions: ['catalog:read', 'bookings:read'],
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});

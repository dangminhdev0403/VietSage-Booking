import {
  resolveEffectivePermissions,
  resolveEffectiveRole,
} from './permission-resolver.helper';

describe('permission-resolver.helper', () => {
  describe('resolveEffectiveRole', () => {
    it('normalizes SUPER_ADMIN to ADMIN', () => {
      expect(resolveEffectiveRole('SUPER_ADMIN')).toBe('ADMIN');
    });

    it('preserves ADMIN and HOTEL_PARTNER roles', () => {
      expect(resolveEffectiveRole('ADMIN')).toBe('ADMIN');
      expect(resolveEffectiveRole('HOTEL_PARTNER')).toBe('HOTEL_PARTNER');
    });

    it('returns empty string when role is missing', () => {
      expect(resolveEffectiveRole(undefined)).toBe('');
      expect(resolveEffectiveRole(null)).toBe('');
    });
  });

  describe('resolveEffectivePermissions (fail-closed)', () => {
    it('returns empty array when roleAssignments is null or undefined', () => {
      expect(resolveEffectivePermissions(null)).toEqual([]);
      expect(resolveEffectivePermissions(undefined)).toEqual([]);
    });

    it('returns empty array when roleAssignments is empty', () => {
      expect(resolveEffectivePermissions([])).toEqual([]);
    });

    it('extracts and deduplicates permissions across assignments', () => {
      const assignments = [
        {
          role: {
            rolePermissions: [
              { permissionKey: 'catalog:read' },
              { permissionKey: 'bookings:read' },
            ],
          },
        },
        {
          role: {
            rolePermissions: [
              { permissionKey: 'bookings:read' },
              { permissionKey: 'payments:read' },
            ],
          },
        },
      ];

      const permissions = resolveEffectivePermissions(assignments);
      expect(permissions).toEqual([
        'catalog:read',
        'bookings:read',
        'payments:read',
      ]);
    });
  });
});

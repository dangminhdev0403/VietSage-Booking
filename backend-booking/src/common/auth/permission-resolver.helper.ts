export type RolePermissionLike = {
  permissionKey: string;
};

export type RoleLike = {
  rolePermissions?: RolePermissionLike[];
};

export type RoleAssignmentLike = {
  role?: RoleLike | null;
};

export function resolveEffectiveRole(role?: string | null): string {
  if (!role) return '';
  return role === 'SUPER_ADMIN' ? 'ADMIN' : role;
}

/**
 * Resolves effective permissions from an account's role assignments.
 * Fail-Closed: When role assignments are empty, null, or undefined, returns []
 * without granting any fallback permissions.
 */
export function resolveEffectivePermissions(
  roleAssignments?: RoleAssignmentLike[] | null,
): string[] {
  if (!roleAssignments || roleAssignments.length === 0) {
    return [];
  }

  const assignedPermissions = roleAssignments.flatMap((assignment) =>
    assignment.role?.rolePermissions?.map((rp) => rp.permissionKey) ?? [],
  );

  return Array.from(new Set(assignedPermissions.filter(Boolean)));
}

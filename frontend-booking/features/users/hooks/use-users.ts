'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { usersResource } from '../service/users.resource';
import type { UserFilter } from '../service/users.client';

const users = usersResource.bind();

export function useUsersQuery(filter?: UserFilter, options?: { enabled?: boolean }) {
  const queryOptions = users.queries.list.options(filter);
  return useQuery({
    ...queryOptions,
    enabled: options?.enabled ?? true,
  });
}

export function useApprovePartnerMutation() {
  return useMutation(users.mutations.approvePartner.options());
}

export function useUpdateUserRoleMutation() {
  return useMutation(users.mutations.updateUserRole.options());
}

export function useRegisterPartnerMutation() {
  return useMutation(users.mutations.registerPartner.options());
}

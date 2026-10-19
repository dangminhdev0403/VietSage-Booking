import {
  createResource,
  defineMutation,
  defineQuery,
} from '@dangminhdev04032005/query-resource';
import {
  approvePartner,
  listUsers,
  registerPartner,
  updateUserRole,
  type ApprovePartnerPayload,
  type RegisterPartnerPayload,
  type UpdateUserRolePayload,
  type UserFilter,
} from './users.client';

export const usersResource = createResource<void>()({
  namespace: ['booking-manager'],
  name: 'users',
  scopeKey: () => ['admin'],
  queries: {
    list: defineQuery({
      inputKey: (filter?: UserFilter) => [
        filter?.role ?? 'ALL',
        filter?.search ?? '',
        filter?.status ?? 'all',
        String(filter?.page ?? 1),
        String(filter?.pageSize ?? 20),
      ],
      queryFn: ({ input }) => listUsers(input),
    }),
  },
  mutations: {
    approvePartner: defineMutation({
      mutationFn: ({
        variables,
      }: {
        variables: { userId: string; payload: ApprovePartnerPayload };
      }) => approvePartner(variables.userId, variables.payload),
    }),
    updateUserRole: defineMutation({
      mutationFn: ({
        variables,
      }: {
        variables: { userId: string; payload: UpdateUserRolePayload };
      }) => updateUserRole(variables.userId, variables.payload),
    }),
    registerPartner: defineMutation({
      mutationFn: ({
        variables,
      }: {
        variables: RegisterPartnerPayload;
      }) => registerPartner(variables),
    }),
  },
});

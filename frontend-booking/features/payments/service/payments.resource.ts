import {
  createResource,
  defineQuery,
} from '@dangminhdev04032005/query-resource';
import {
  listPayments,
  type ListPaymentsParams,
} from './payments.client';

export const paymentsResource = createResource<void>()({
  namespace: ['booking-manager'],
  name: 'payments',
  scopeKey: () => ['user'],
  queries: {
    list: defineQuery({
      inputKey: (params?: ListPaymentsParams) => [
        params?.property_id ?? '',
        params?.status ?? 'ALL',
        String(params?.page ?? 1),
        String(params?.pageSize ?? 10),
      ],
      queryFn: ({ input }) => listPayments(input),
    }),
  },
});

import {
  createResource,
  defineMutation,
  defineQuery,
} from '@dangminhdev04032005/query-resource';
import {
  createBooking,
  listBookings,
  updateBookingStatus,
  type CreateBookingPayload,
} from './bookings.client';

export const bookingsResource = createResource<void>()({
  namespace: ['booking-manager'],
  name: 'bookings',
  scopeKey: () => ['user'],
  queries: {
    list: defineQuery({
      inputKey: (params?: { status?: string; page?: number; pageSize?: number }) => [
        params?.status ?? 'ALL',
        String(params?.page ?? 1),
        String(params?.pageSize ?? 10),
      ],
      queryFn: ({ input }) => listBookings(input),
    }),
  },
  mutations: {
    create: defineMutation({
      mutationFn: ({ variables }: { variables: CreateBookingPayload }) =>
        createBooking(variables),
      invalidates: [{ type: 'query', operation: 'list' }],
    }),
    updateStatus: defineMutation({
      mutationFn: ({
        variables,
      }: {
        variables: { id: string; status: string; reason?: string };
      }) => updateBookingStatus(variables.id, variables.status, variables.reason),
      invalidates: [{ type: 'query', operation: 'list' }],
    }),
  },
});

import {
  createResource,
  defineMutation,
  defineQuery,
} from '@dangminhdev04032005/query-resource';
import {
  createBooking,
  createDepositCheckout,
  getBookingQuote,
  listBookings,
  updateBookingStatus,
  type CreateBookingPayload,
  type DepositCheckoutPayload,
  type QuoteBookingPayload,
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
    quote: defineQuery({
      inputKey: (params: QuoteBookingPayload) => [
        params.property_id,
        params.room_type_id,
        params.check_in,
        params.check_out,
        String(params.guests ?? 1),
        ...(params.service_ids ?? []),
      ],
      queryFn: ({ input }) => getBookingQuote(input),
    }),
  },
  mutations: {
    create: defineMutation({
      mutationFn: ({ variables }: { variables: CreateBookingPayload }) =>
        createBooking(variables),
      invalidates: [{ type: 'query', operation: 'list' }],
    }),
    checkout: defineMutation({
      mutationFn: ({ variables }: { variables: DepositCheckoutPayload }) =>
        createDepositCheckout(variables),
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


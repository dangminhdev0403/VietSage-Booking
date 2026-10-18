import { useMutation, useQuery } from '@tanstack/react-query';
import { bookingsResource } from '../service/bookings.resource';
import type { ListBookingsParams, QuoteBookingPayload } from '../service/bookings.client';

const bookings = bookingsResource.bind();

export function useBookingsQuery(
  params?: ListBookingsParams,
  options?: { enabled?: boolean },
) {
  const queryOptions = bookings.queries.list.options(params);
  return useQuery({
    ...queryOptions,
    ...(options?.enabled !== undefined ? { enabled: options.enabled } : {}),
  });
}

export function useBookingSummaryQuery(
  params?: { property_id?: string; from?: string; to?: string },
  options?: { enabled?: boolean },
) {
  const queryOptions = bookings.queries.summary.options(params);
  return useQuery({
    ...queryOptions,
    ...(options?.enabled !== undefined ? { enabled: options.enabled } : {}),
  });
}

export function useBookingQuoteQuery(
  params: QuoteBookingPayload,
  options?: { enabled?: boolean },
) {
  const queryOptions = bookings.queries.quote.options(params);
  return useQuery({
    ...queryOptions,
    ...(options?.enabled !== undefined ? { enabled: options.enabled } : {}),
  });
}

export function useCreateBookingMutation() {
  return useMutation(bookings.mutations.create.options());
}

export function useDepositCheckoutMutation() {
  return useMutation(bookings.mutations.checkout.options());
}

export function useUpdateBookingStatusMutation() {
  return useMutation(bookings.mutations.updateStatus.options());
}


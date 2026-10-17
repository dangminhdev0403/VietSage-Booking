import { useMutation, useQuery } from '@tanstack/react-query';
import { bookingsResource } from '../service/bookings.resource';

const bookings = bookingsResource.bind();

export function useBookingsQuery(
  params?: { status?: string; page?: number; pageSize?: number },
  options?: { enabled?: boolean },
) {
  const queryOptions = bookings.queries.list.options(params);
  return useQuery({
    ...queryOptions,
    ...(options?.enabled !== undefined ? { enabled: options.enabled } : {}),
  });
}

export function useCreateBookingMutation() {
  return useMutation(bookings.mutations.create.options());
}

export function useUpdateBookingStatusMutation() {
  return useMutation(bookings.mutations.updateStatus.options());
}

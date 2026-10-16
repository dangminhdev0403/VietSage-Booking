import { useMutation, useQuery } from '@tanstack/react-query';
import { bookingsResource } from '../service/bookings.resource';

const bookings = bookingsResource.bind();

export function useBookingsQuery(params?: { status?: string; page?: number; pageSize?: number }) {
  return useQuery(bookings.queries.list.options(params));
}

export function useCreateBookingMutation() {
  return useMutation(bookings.mutations.create.options());
}

export function useUpdateBookingStatusMutation() {
  return useMutation(bookings.mutations.updateStatus.options());
}

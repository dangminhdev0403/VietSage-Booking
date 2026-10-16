import { backendFetch } from '@/lib/api/backend';
import {
  bookingItemSchema,
  bookingListResponseSchema,
  parseApiResponse,
  successSchema,
} from '@/lib/api/schemas';
import { z } from 'zod';

export type CreateBookingPayload = {
  property_id: string;
  room_type_id?: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  total_price: number;
  special_requests?: string;
  service_ids?: string[];
};

export async function createBooking(payload: CreateBookingPayload) {
  const res = await backendFetch('api/v1/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await parseApiResponse(res, successSchema(bookingItemSchema));
  return data.data;
}

export async function listBookings(params?: { status?: string; page?: number; pageSize?: number }) {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.page) q.set('page', String(params.page));
  if (params?.pageSize) q.set('page_size', String(params.pageSize));

  const query = q.toString() ? `?${q.toString()}` : '';
  const res = await backendFetch(`api/v1/bookings${query}`);
  const data = await parseApiResponse(res, successSchema(bookingListResponseSchema));
  return data.data;
}

export async function updateBookingStatus(id: string, status: string, reason?: string) {
  const res = await backendFetch(`api/v1/bookings/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reason }),
  });
  const data = await parseApiResponse(res, successSchema(z.object({ id: z.string(), status: z.string() })));
  return data.data;
}

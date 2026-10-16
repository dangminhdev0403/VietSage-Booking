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
  room_type_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  total_price?: number; // Estimated locally for display, authoritative price is server-derived
  special_requests?: string;
  service_ids?: string[];
};

export async function createBooking(payload: CreateBookingPayload) {
  // Strip client-estimated total_price to prevent tampering; server calculates authoritative total
  const submitBody: Partial<CreateBookingPayload> = { ...payload };
  delete submitBody.total_price;
  const res = await backendFetch('api/v1/bookings', {
    method: 'POST',
    body: JSON.stringify(submitBody),
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
  // Route through Next.js BFF to attach session bearer token
  const res = await fetch(`/api/bookings${query}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const data = await parseApiResponse(res, successSchema(bookingListResponseSchema));
  return data.data;
}

export async function getBooking(id: string) {
  // Route through Next.js BFF
  const res = await fetch(`/api/bookings/${id}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const data = await parseApiResponse(res, successSchema(bookingItemSchema));
  return data.data;
}

export async function updateBookingStatus(id: string, status: string, reason?: string) {
  // Route through Next.js BFF
  const res = await fetch(`/api/bookings/${id}/status`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, reason }),
  });
  const data = await parseApiResponse(res, successSchema(z.object({ id: z.string(), status: z.string() })));
  return data.data;
}

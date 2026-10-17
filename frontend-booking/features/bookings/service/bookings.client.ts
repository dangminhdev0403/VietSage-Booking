import {
  bookingItemSchema,
  bookingListResponseSchema,
  parseApiResponse,
  paymentIntentSchema,
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
  // Route through Next.js BFF to attach session bearer token
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
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
  if (res.status === 401) {
    return {
      items: [],
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? 10,
      total: 0,
      has_next: false,
    };
  }
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

export async function lookupBooking(bookingCode: string, contact: string) {
  const res = await fetch('/api/bookings/lookup', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ booking_code: bookingCode, contact }),
  });
  const data = await parseApiResponse(res, successSchema(bookingItemSchema));
  return data.data;
}

export async function createPaymentIntent(
  bookingId: string,
  paymentMethod = 'VIETQR',
  contact?: string,
) {
  const res = await fetch('/api/payments/create-intent', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      booking_id: bookingId,
      payment_method: paymentMethod,
      ...(contact ? { contact } : {}),
    }),
  });
  const data = await parseApiResponse(res, successSchema(paymentIntentSchema));
  return data.data;
}

export async function confirmPayment(bookingId: string) {
  const res = await fetch('/api/payments/confirm', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ booking_id: bookingId }),
  });
  const data = await parseApiResponse(res, successSchema(z.object({
    booking_id: z.string(),
    booking_code: z.string(),
    amount: z.number(),
    payment_status: z.string(),
    booking_status: z.string(),
    paid_at: z.string(),
    message: z.string(),
  })));
  return data.data;
}

export async function getPaymentInfo(bookingId: string, contact?: string) {
  const query = contact ? `?contact=${encodeURIComponent(contact)}` : '';
  const res = await fetch(`/api/payments/booking/${bookingId}${query}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const data = await parseApiResponse(res, successSchema(z.unknown()));
  return data.data;
}

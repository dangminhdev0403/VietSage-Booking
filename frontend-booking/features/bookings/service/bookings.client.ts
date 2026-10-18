import {
  bookingItemSchema,
  bookingListResponseSchema,
  bookingQuoteSchema,
  bookingSummarySchema,
  depositCheckoutResponseSchema,
  parseApiResponse,
  paymentIntentSchema,
  successSchema,
} from '@/lib/api/schemas';
import { z } from 'zod';

export type QuoteBookingPayload = {
  property_id: string;
  room_type_id: string;
  check_in: string;
  check_out: string;
  guests?: number;
  service_ids?: string[];
};

export type CreateBookingPayload = {
  property_id: string;
  room_type_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  guests?: number;
  total_price?: number; // Estimated locally for display, authoritative price is server-derived
  special_requests?: string;
  service_ids?: string[];
};

export type DepositCheckoutPayload = {
  booking_code: string;
  lookup_token?: string;
  return_url?: string;
};

export async function getBookingQuote(payload: QuoteBookingPayload) {
  const res = await fetch('/api/bookings/quote', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await parseApiResponse(res, successSchema(bookingQuoteSchema));
  return data.data;
}

export async function createBooking(payload: CreateBookingPayload) {
  // Strip client-estimated total_price to prevent tampering; server calculates authoritative total
  const submitBody: Partial<CreateBookingPayload> = { ...payload };
  delete submitBody.total_price;
  // Route through Next.js BFF
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

export async function createDepositCheckout(payload: DepositCheckoutPayload) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (payload.lookup_token) {
    headers['x-lookup-token'] = payload.lookup_token;
  }
  const body = {
    ...payload,
    return_url:
      payload.return_url ||
      (typeof window !== 'undefined' ? window.location.origin : undefined),
  };
  const res = await fetch('/api/payments/checkout', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await parseApiResponse(res, successSchema(depositCheckoutResponseSchema));
  return data.data;
}

export async function verifyCheckoutPayment(payload: {
  booking_code: string;
  session_id?: string;
  lookup_token?: string;
}) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (payload.lookup_token) {
    headers['x-lookup-token'] = payload.lookup_token;
  }
  const res = await fetch('/api/payments/verify-checkout', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await parseApiResponse(
    res,
    successSchema(
      z.object({
        booking_code: z.string(),
        status: z.string(),
        payment_status: z.string(),
        is_paid: z.boolean(),
        paid_at: z.string().optional(),
        lookup_token: z.string().optional(),
      }),
    ),
  );
  return data.data;
}

export type ListBookingsParams = {
  search?: string;
  status?: string;
  payment_status?: string;
  property_id?: string;
  check_in_from?: string;
  check_in_to?: string;
  page?: number;
  pageSize?: number;
};

export async function listBookings(params?: ListBookingsParams) {
  const q = new URLSearchParams();
  if (params?.search) q.set('search', params.search);
  if (params?.status) q.set('status', params.status);
  if (params?.payment_status) q.set('payment_status', params.payment_status);
  if (params?.property_id) q.set('property_id', params.property_id);
  if (params?.check_in_from) q.set('check_in_from', params.check_in_from);
  if (params?.check_in_to) q.set('check_in_to', params.check_in_to);
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

export async function getBookingSummary(params?: {
  property_id?: string;
  from?: string;
  to?: string;
}) {
  const q = new URLSearchParams();
  if (params?.property_id) q.set('property_id', params.property_id);
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);

  const query = q.toString() ? `?${q.toString()}` : '';
  const res = await fetch(`/api/bookings/summary${query}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (res.status === 401) {
    return {
      gross_booking_value: 0,
      total_bookings: 0,
      confirmed_bookings: 0,
      pending_bookings: 0,
      cancelled_bookings: 0,
      upcoming_checkins_7d: 0,
    };
  }
  const data = await parseApiResponse(res, successSchema(bookingSummarySchema));
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

export async function lookupBooking(bookingCode: string, tokenOrContact: string) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  headers['x-lookup-token'] = tokenOrContact;

  const res = await fetch('/api/bookings/lookup', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      booking_code: bookingCode,
      lookup_token: tokenOrContact,
      contact: tokenOrContact,
    }),
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

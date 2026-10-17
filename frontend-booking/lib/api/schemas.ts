import { z } from 'zod';

export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
  request_id: z.string().optional(),
});

export function successSchema<T extends z.ZodTypeAny>(data: T) {
  return z.object({
    success: z.literal(true),
    data,
    meta: z.record(z.string(), z.unknown()).optional(),
  });
}

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    public readonly requestId?: string,
    public readonly status = 500,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export async function parseApiResponse<T>(
  response: Response,
  schema: z.ZodType<T>,
): Promise<T> {
  const body: unknown = await response.json().catch(() => null);
  const error = apiErrorSchema.safeParse(body);

  if (error.success) {
    const errObj = error.data.error;
    console.error(
      `[API Error] ${response.url} (${response.status}): [${errObj.code}] ${errObj.message}`,
      errObj.details ?? '',
    );
    throw new ApiClientError(
      errObj.code,
      errObj.message,
      errObj.details,
      error.data.request_id,
      response.status,
    );
  }

  if (!response.ok) {
    console.error(`[API Upstream Error] ${response.url} (${response.status}):`, body);
    throw new ApiClientError(
      'UPSTREAM_ERROR',
      'Yêu cầu đến máy chủ thất bại',
      undefined,
      undefined,
      response.status,
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    console.error(
      `[Schema Mismatch] ${response.url}:\nIssues: ${JSON.stringify(parsed.error.issues, null, 2)}`,
    );
    throw parsed.error;
  }

  return parsed.data;
}

// -------------------------------------------------------------
// Domain Schemas
// -------------------------------------------------------------

export const roomTypeSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  max_guests: z.number(),
  base_price: z.number(),
  description: z.string().nullable().optional(),
  amenities: z.array(z.string()).default([]),
  allotments: z.array(z.object({
    date: z.string(),
    total_rooms: z.number(),
    booked_rooms: z.number(),
    available_rooms: z.number(),
    price: z.number(),
    is_blocked: z.boolean(),
  })).default([]),
});

export const propertyItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  city: z.string(),
  address: z.string(),
  description: z.string().nullable().optional(),
  star_rating: z.number(),
  thumbnail_url: z.string().nullable().optional(),
  images: z.array(z.string()).default([]),
  room_types: z.array(roomTypeSummarySchema).default([]),
  created_at: z.string(),
});

export const propertyListResponseSchema = z.object({
  items: z.array(propertyItemSchema),
  page: z.number(),
  page_size: z.number(),
  total: z.number(),
  has_next: z.boolean(),
});

export const addonServiceItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  price: z.number(),
  description: z.string().nullable().optional(),
  is_active: z.boolean(),
});

export const paymentRecordSchema = z.object({
  id: z.string(),
  payment_method: z.string(),
  amount: z.number(),
  status: z.string(),
  transaction_ref: z.string().optional(),
  qr_code_url: z.string().nullable().optional(),
  paid_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export const bookingQuoteSchema = z.object({
  property_id: z.string(),
  property_name: z.string(),
  room_type_id: z.string(),
  room_type_name: z.string(),
  check_in: z.string(),
  check_out: z.string(),
  nights: z.number(),
  daily_prices: z.array(z.object({
    date: z.string(),
    price: z.number(),
  })).default([]),
  room_subtotal: z.number(),
  addon_subtotal: z.number().default(0),
  total_price: z.number(),
  deposit_rate_bps: z.number().default(3000),
  deposit_amount: z.number(),
  balance_due: z.number(),
  currency: z.string().default('VND'),
  expires_at: z.string(),
});

export const bookingItemSchema = z.object({
  id: z.string(),
  booking_code: z.string(),
  lookup_token: z.string().optional(),
  property_id: z.string(),
  property_name: z.string().optional(),
  property_address: z.string().optional(),
  room_type_name: z.string().nullable().optional(),
  guest_name: z.string(),
  guest_email: z.string(),
  guest_phone: z.string(),
  check_in: z.string(),
  check_out: z.string(),
  nights: z.number(),
  room_subtotal: z.number().optional(),
  addon_subtotal: z.number().optional(),
  total_price: z.number(),
  deposit_rate_bps: z.number().optional(),
  deposit_amount: z.number().optional(),
  balance_due: z.number().optional(),
  currency: z.string().default('VND'),
  status: z.string(),
  payment_status: z.string().default('UNPAID'),
  special_requests: z.string().nullable().optional(),
  addons: z.array(z.object({
    service_name: z.string(),
    price: z.number(),
  })).default([]),
  payments: z.array(paymentRecordSchema).default([]),
  hold_expires_at: z.string().optional(),
  created_at: z.string(),
});

export const bookingListResponseSchema = z.object({
  items: z.array(bookingItemSchema),
  page: z.number(),
  page_size: z.number(),
  total: z.number(),
  has_next: z.boolean(),
});

export const paymentIntentSchema = z.object({
  id: z.string(),
  booking_id: z.string(),
  booking_code: z.string(),
  amount: z.number(),
  currency: z.string(),
  payment_method: z.string(),
  status: z.string(),
  transaction_ref: z.string(),
  bank_code: z.string(),
  bank_name: z.string(),
  account_number: z.string(),
  account_holder: z.string(),
  transfer_content: z.string(),
  qr_code_url: z.string(),
  created_at: z.string(),
});

export const depositCheckoutResponseSchema = z.object({
  checkout_url: z.string(),
  session_id: z.string(),
  amount: z.number(),
  currency: z.string().default('VND'),
  expires_at: z.string().optional(),
});


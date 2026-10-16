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
    console.error(`[API Error] ${response.url} (${response.status}):`, error.data.error);
    throw new ApiClientError(
      error.data.error.code,
      error.data.error.message,
      error.data.error.details,
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
  description: z.string().optional(),
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

export const bookingItemSchema = z.object({
  id: z.string(),
  booking_code: z.string(),
  property_id: z.string(),
  property_name: z.string(),
  room_type_name: z.string().nullable().optional(),
  guest_name: z.string(),
  guest_email: z.string(),
  guest_phone: z.string(),
  check_in: z.string(),
  check_out: z.string(),
  nights: z.number(),
  total_price: z.number(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED']),
  special_requests: z.string().nullable().optional(),
  addons: z.array(z.object({
    service_name: z.string(),
    price: z.number(),
  })).default([]),
  created_at: z.string(),
});

export const bookingListResponseSchema = z.object({
  items: z.array(bookingItemSchema),
  page: z.number(),
  page_size: z.number(),
  total: z.number(),
  has_next: z.boolean(),
});

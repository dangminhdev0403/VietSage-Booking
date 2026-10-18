import { z } from "zod";

export const apiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: z.record(z.string(), z.unknown()).optional(),
  });

export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
  request_id: z.string().optional(),
});

export const accountRoleSchema = z.enum(["ADMIN"]);

export const accountSchema = z.object({
  id: z.string(),
  username: z.string(),
  display_name: z.string(),
  email: z.string().email(),
  role: accountRoleSchema,
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const authTokensSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
  account: accountSchema,
});

export const propertySchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  address: z.string(),
  description: z.string().nullable().optional(),
  star_rating: z.number().default(4),
  thumbnail_url: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string(),
});

export const addonServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  price: z.number(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});

export const bookingStatusSchema = z.enum(["PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED"]);

export const bookingSchema = z.object({
  id: z.string(),
  booking_code: z.string(),
  property_id: z.string(),
  property_name: z.string().optional(),
  room_type_id: z.string().nullable().optional(),
  guest_name: z.string(),
  guest_email: z.string(),
  guest_phone: z.string(),
  check_in: z.string(),
  check_out: z.string(),
  total_price: z.number(),
  status: bookingStatusSchema,
  special_requests: z.string().nullable().optional(),
  created_at: z.string(),
});

export const bookingSummarySchema = z.object({
  total_bookings: z.number(),
  gross_booking_value: z.number(),
  pending_count: z.number(),
  confirmed_count: z.number(),
  cancelled_count: z.number(),
  upcoming_checkins_count: z.number(),
});

export const paymentItemSchema = z.object({
  id: z.string(),
  booking_id: z.string(),
  booking_code: z.string().optional(),
  property_id: z.string().optional(),
  property_name: z.string().optional(),
  guest_name: z.string().optional(),
  payment_method: z.string(),
  amount: z.number(),
  currency: z.string(),
  purpose: z.string().optional(),
  status: z.string(),
  provider_name: z.string().optional(),
  provider_payment_id: z.string().nullable().optional(),
  transaction_ref: z.string(),
  qr_code_url: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  refunded_amount: z.number().nullable().optional(),
  paid_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

export const paymentListResponseSchema = z.object({
  items: z.array(paymentItemSchema),
  total: z.number(),
  page: z.number(),
  page_size: z.number(),
  has_next: z.boolean(),
});

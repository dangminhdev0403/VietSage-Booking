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

export const accountRoleSchema = z.enum(["SUPER_ADMIN", "ADMIN", "HOTEL_PARTNER", "TRAVELER"]);

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

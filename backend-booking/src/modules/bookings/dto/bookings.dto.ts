import { z } from 'zod';

export const createBookingSchema = z.object({
  property_id: z.string().uuid(),
  room_type_id: z.string().uuid(),
  guest_name: z.string().min(2),
  guest_email: z.string().email(),
  guest_phone: z.string().min(8),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày check-in phải là YYYY-MM-DD'),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày check-out phải là YYYY-MM-DD'),
  total_price: z.number().int().min(0).optional(), // Ignored by server, calculated authoritatively
  special_requests: z.string().optional(),
  service_ids: z.array(z.string().uuid()).optional(),
});
export type CreateBookingDto = z.infer<typeof createBookingSchema>;

export const updateBookingStatusSchema = z.object({
  status: z.literal('CANCELLED'),
  reason: z.string().optional(),
});
export type UpdateBookingStatusDto = z.infer<typeof updateBookingStatusSchema>;

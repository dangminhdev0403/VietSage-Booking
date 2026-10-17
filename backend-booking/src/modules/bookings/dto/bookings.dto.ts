import { z } from 'zod';

export const isValidCalendarDate = (val: string): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(val);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
};

export const quoteBookingSchema = z.object({
  property_id: z.string().uuid(),
  room_type_id: z.string().uuid(),
  check_in: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày check-in phải là YYYY-MM-DD')
    .refine(isValidCalendarDate, {
      message:
        'Ngày nhận phòng không tồn tại trong lịch thực tế (rollover date)',
    }),
  check_out: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày check-out phải là YYYY-MM-DD')
    .refine(isValidCalendarDate, {
      message:
        'Ngày trả phòng không tồn tại trong lịch thực tế (rollover date)',
    }),
  guests: z.number().int().min(1).optional(),
  guest_count: z.number().int().min(1).optional(),
  service_ids: z.array(z.string().uuid()).optional(),
});
export type QuoteBookingDto = z.infer<typeof quoteBookingSchema>;

export const createBookingSchema = z.object({
  property_id: z.string().uuid(),
  room_type_id: z.string().uuid(),
  guest_name: z.string().min(2),
  guest_email: z.string().email(),
  guest_phone: z.string().min(8),
  check_in: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày check-in phải là YYYY-MM-DD')
    .refine(isValidCalendarDate, {
      message:
        'Ngày nhận phòng không tồn tại trong lịch thực tế (rollover date)',
    }),
  check_out: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày check-out phải là YYYY-MM-DD')
    .refine(isValidCalendarDate, {
      message:
        'Ngày trả phòng không tồn tại trong lịch thực tế (rollover date)',
    }),
  total_price: z.number().int().min(0).optional(), // Ignored by server, calculated authoritatively
  special_requests: z.string().optional(),
  service_ids: z.array(z.string().uuid()).optional(),
  idempotency_key: z.string().min(1).optional(),
});
export type CreateBookingDto = z.infer<typeof createBookingSchema>;

export const updateBookingStatusSchema = z.object({
  status: z.literal('CANCELLED'),
  reason: z.string().optional(),
});
export type UpdateBookingStatusDto = z.infer<typeof updateBookingStatusSchema>;

export const lookupBookingSchema = z.object({
  booking_code: z.string().min(3),
  lookup_token: z.string().min(1).optional(),
  token: z.string().min(1).optional(),
  contact: z.string().optional(),
});
export type LookupBookingDto = z.infer<typeof lookupBookingSchema>;

export const cancelBookingSchema = z.object({
  lookup_token: z.string().min(1).optional(),
  token: z.string().min(1).optional(),
  reason: z.string().optional(),
});
export type CancelBookingDto = z.infer<typeof cancelBookingSchema>;

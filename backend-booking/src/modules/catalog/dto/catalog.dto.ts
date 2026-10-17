import { z } from 'zod';

export const createPropertySchema = z.object({
  name: z.string().min(2),
  city: z.string().min(2),
  address: z.string().min(5),
  description: z.string().optional(),
  star_rating: z.number().min(1).max(5).optional().default(4),
  thumbnail_url: z.string().url().optional(),
});
export type CreatePropertyDto = z.infer<typeof createPropertySchema>;

export const createServiceSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  price: z.number().int().min(0),
  description: z.string().optional(),
});
export type CreateServiceDto = z.infer<typeof createServiceSchema>;

export const updateAllotmentSchema = z
  .object({
    room_type_id: z.string().min(1, 'Mã hạng phòng không được để trống'),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày phải là YYYY-MM-DD'),
    total_rooms: z
      .number()
      .int()
      .min(0, 'Số lượng phòng không được âm')
      .optional(),
    price: z.number().int().min(0, 'Giá phòng không được âm').optional(),
    is_blocked: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.total_rooms !== undefined ||
      data.price !== undefined ||
      data.is_blocked !== undefined,
    { message: 'Cần cung cấp ít nhất một trường tồn kho để cập nhật' },
  );
export type UpdateAllotmentDto = z.infer<typeof updateAllotmentSchema>;

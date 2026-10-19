import { z } from 'zod';

export const createPropertySchema = z.object({
  name: z.string().min(2),
  city: z.string().min(2),
  address: z.string().min(5),
  description: z.string().optional(),
  star_rating: z.number().min(1).max(5).optional().default(4),
  thumbnail_url: z.string().url().optional(),
  vietsage_hotel_id: z.string().optional().nullable(),
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

export const createRoomTypeSchema = z.object({
  property_id: z.string().optional(),
  name: z.string().min(2, 'Tên hạng phòng phải từ 2 ký tự trở lên'),
  description: z.string().optional(),
  max_guests: z.number().int().min(1, 'Số khách tối đa ít nhất là 1').optional().default(2),
  base_price: z.number().int().min(1000, 'Giá phòng tối thiểu 1.000 VND'),
  area_sqm: z.number().min(5, 'Diện tích phòng tối thiểu 5m²').optional(),
  bed_type: z.string().optional(),
  bed_count: z.number().int().min(1).optional(),
  has_sea_view: z.boolean().optional().default(false),
  amenities: z.array(z.string()).optional(),
  is_active: z.boolean().optional().default(true),
  vietsage_room_type_id: z.string().optional().nullable(),
});
export type CreateRoomTypeDto = z.input<typeof createRoomTypeSchema>;

export const updateRoomTypeSchema = z.object({
  name: z.string().min(2, 'Tên hạng phòng phải từ 2 ký tự trở lên').optional(),
  description: z.string().optional(),
  max_guests: z.number().int().min(1, 'Số khách tối đa ít nhất là 1').optional(),
  base_price: z.number().int().min(1000, 'Giá phòng tối thiểu 1.000 VND').optional(),
  area_sqm: z.number().min(5, 'Diện tích phòng tối thiểu 5m²').optional(),
  bed_type: z.string().optional(),
  bed_count: z.number().int().min(1).optional(),
  has_sea_view: z.boolean().optional(),
  amenities: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
  vietsage_room_type_id: z.string().optional().nullable(),
});
export type UpdateRoomTypeDto = z.input<typeof updateRoomTypeSchema>;

export const updatePropertySchema = z.object({
  name: z.string().min(2, 'Tên khách sạn phải từ 2 ký tự trở lên').optional(),
  city: z.string().min(2, 'Tỉnh/Thành phố phải từ 2 ký tự trở lên').optional(),
  address: z.string().min(5, 'Địa chỉ cụ thể phải từ 5 ký tự trở lên').optional(),
  description: z.string().optional(),
  star_rating: z.number().min(1).max(5).optional(),
  thumbnail_url: z.string().url().optional().or(z.literal('')),
  images: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
  vietsage_hotel_id: z.string().optional().nullable(),
});
export type UpdatePropertyDto = z.input<typeof updatePropertySchema>;


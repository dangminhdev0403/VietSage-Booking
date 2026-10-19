import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});
export type LoginDto = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  display_name: z.string().min(2),
  email: z.string().email(),
});
export type RegisterDto = z.infer<typeof registerSchema>;

export const refreshSchema = z.object({
  refresh_token: z.string().min(10),
});
export type RefreshDto = z.infer<typeof refreshSchema>;

export const updateProfileSchema = z.object({
  display_name: z.string().min(2).optional(),
  email: z.string().email().optional(),
});
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  old_password: z.string().min(6),
  new_password: z.string().min(6),
});
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

export const registerPartnerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
  display_name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  property_name: z.string().min(2).max(150),
  city: z.string().min(2).max(100),
  address: z.string().min(3).max(255),
  description: z.string().max(1000).optional(),
});
export type RegisterPartnerDto = z.infer<typeof registerPartnerSchema>;

export const approvePartnerSchema = z.object({
  managed_property_id: z.string().uuid().optional(),
  is_active: z.boolean().optional(),
});
export type ApprovePartnerDto = z.infer<typeof approvePartnerSchema>;

export const updateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'HOTEL_PARTNER', 'TRAVELER']),
  managed_property_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().optional(),
});
export type UpdateUserRoleDto = z.infer<typeof updateUserRoleSchema>;

export const listUsersQuerySchema = z.object({
  role: z.enum(['ALL', 'ADMIN', 'HOTEL_PARTNER', 'TRAVELER']).optional(),
  search: z.string().optional(),
  status: z.enum(['all', 'active', 'inactive', 'pending']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  page_size: z.coerce.number().int().min(1).max(100).optional().default(20),
});
export type ListUsersQueryDto = z.infer<typeof listUsersQuerySchema>;


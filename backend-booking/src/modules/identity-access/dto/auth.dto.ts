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

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

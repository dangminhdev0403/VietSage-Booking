import { backendFetch } from '@/lib/api/backend';
import {
  addonServiceItemSchema,
  parseApiResponse,
  propertyItemSchema,
  propertyListResponseSchema,
  successSchema,
} from '@/lib/api/schemas';
import { z } from 'zod';

export type PropertyFilter = {
  city?: string;
  keyword?: string;
  min_price?: number;
  max_price?: number;
  star_rating?: number;
  guests?: number;
  sort_by?: 'price_asc' | 'price_desc' | 'rating_desc' | 'newest';
  page?: number;
  pageSize?: number;
};

export async function listProperties(filter?: PropertyFilter) {
  const params = new URLSearchParams();
  if (filter?.city) params.set('city', filter.city);
  if (filter?.keyword) params.set('keyword', filter.keyword);
  if (filter?.min_price) params.set('min_price', String(filter.min_price));
  if (filter?.max_price) params.set('max_price', String(filter.max_price));
  if (filter?.star_rating) params.set('star_rating', String(filter.star_rating));
  if (filter?.guests) params.set('guests', String(filter.guests));
  if (filter?.sort_by) params.set('sort_by', filter.sort_by);
  if (filter?.page) params.set('page', String(filter.page));
  if (filter?.pageSize) params.set('page_size', String(filter.pageSize));

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await backendFetch(`api/v1/properties${query}`);
  const data = await parseApiResponse(res, successSchema(propertyListResponseSchema));
  return data.data;
}

export async function getProperty(id: string) {
  const res = await backendFetch(`api/v1/properties/${id}`);
  const data = await parseApiResponse(res, successSchema(propertyItemSchema));
  return data.data;
}

export type CreatePropertyPayload = {
  name: string;
  city: string;
  address: string;
  description?: string;
  star_rating?: number;
  thumbnail_url?: string;
};

export async function createProperty(payload: CreatePropertyPayload) {
  const res = await fetch('/api/admin/properties', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await parseApiResponse(res, successSchema(propertyItemSchema.passthrough()));
  return data.data;
}

export const allotmentDaySchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  total_rooms: z.number(),
  booked_rooms: z.number(),
  available_rooms: z.number(),
  price: z.number(),
  is_blocked: z.boolean(),
});
export type AllotmentDay = z.infer<typeof allotmentDaySchema>;

export const roomTypeAllotmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  base_price: z.number(),
  total_rooms: z.number(),
  allotments: z.array(allotmentDaySchema),
});
export type RoomTypeAllotment = z.infer<typeof roomTypeAllotmentSchema>;

export const propertyAllotmentResponseSchema = z.object({
  property_id: z.string(),
  property_name: z.string(),
  month: z.string(),
  room_types: z.array(roomTypeAllotmentSchema),
});
export type PropertyAllotmentResponse = z.infer<typeof propertyAllotmentResponseSchema>;

export async function getPropertyAllotments(id: string, month?: string): Promise<PropertyAllotmentResponse> {
  const monthQuery = month ? `&month=${encodeURIComponent(month)}` : '';
  const res = await fetch(`/api/admin/allotments?property_id=${encodeURIComponent(id)}${monthQuery}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const data = await parseApiResponse(res, successSchema(propertyAllotmentResponseSchema));
  return data.data;
}

export async function updateAllotment(payload: {
  room_type_id: string;
  date: string;
  total_rooms?: number;
  price?: number;
  is_blocked?: boolean;
}) {
  const res = await fetch('/api/admin/allotments', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await parseApiResponse(res, successSchema(allotmentDaySchema.passthrough()));
  return data.data;
}

export async function listServices(category?: string) {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  const res = await backendFetch(`api/v1/services${query}`);
  const data = await parseApiResponse(res, successSchema(z.array(addonServiceItemSchema)));
  return data.data;
}

export type CreateRoomTypePayload = {
  property_id?: string;
  name: string;
  description?: string;
  max_guests?: number;
  base_price: number;
  area_sqm?: number;
  bed_type?: string;
  bed_count?: number;
  has_sea_view?: boolean;
  amenities?: string[];
  is_active?: boolean;
};

export type UpdateRoomTypePayload = {
  name?: string;
  description?: string;
  max_guests?: number;
  base_price?: number;
  area_sqm?: number;
  bed_type?: string;
  bed_count?: number;
  has_sea_view?: boolean;
  amenities?: string[];
  is_active?: boolean;
};

export async function createRoomType(payload: CreateRoomTypePayload) {
  const res = await fetch('/api/admin/room-types', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await parseApiResponse(res, successSchema(z.any()));
  return data.data;
}

export async function updateRoomType(id: string, payload: UpdateRoomTypePayload) {
  const res = await fetch(`/api/admin/room-types/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await parseApiResponse(res, successSchema(z.any()));
  return data.data;
}

export async function deleteRoomType(id: string) {
  const res = await fetch(`/api/admin/room-types/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
    },
  });
  const data = await parseApiResponse(res, successSchema(z.any()));
  return data.data;
}

export type UpdatePropertyPayload = {
  name?: string;
  city?: string;
  address?: string;
  description?: string;
  star_rating?: number;
  thumbnail_url?: string;
  images?: string[];
  is_active?: boolean;
};

export async function updateProperty(id: string, payload: UpdatePropertyPayload) {
  const res = await fetch(`/api/admin/properties/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await parseApiResponse(res, successSchema(z.any()));
  return data.data;
}



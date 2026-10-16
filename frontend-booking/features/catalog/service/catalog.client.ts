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
  page?: number;
  pageSize?: number;
};

export async function listProperties(filter?: PropertyFilter) {
  const params = new URLSearchParams();
  if (filter?.city) params.set('city', filter.city);
  if (filter?.keyword) params.set('keyword', filter.keyword);
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

export async function listServices(category?: string) {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  const res = await backendFetch(`api/v1/services${query}`);
  const data = await parseApiResponse(res, successSchema(z.array(addonServiceItemSchema)));
  return data.data;
}

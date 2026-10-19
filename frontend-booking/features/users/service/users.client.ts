import { parseApiResponse, successSchema } from '@/lib/api/schemas';
import { z } from 'zod';

export type RegisterPartnerPayload = {
  username: string;
  password: string;
  display_name: string;
  email: string;
  phone?: string;
  property_name: string;
  city: string;
  address: string;
  description?: string;
};

export type ApprovePartnerPayload = {
  managed_property_id?: string;
  is_active?: boolean;
};

export type UpdateUserRolePayload = {
  role: 'ADMIN' | 'HOTEL_PARTNER' | 'TRAVELER';
  managed_property_id?: string | null;
  is_active?: boolean;
};

export type UserFilter = {
  role?: 'ALL' | 'ADMIN' | 'HOTEL_PARTNER' | 'TRAVELER';
  search?: string;
  status?: 'all' | 'active' | 'inactive' | 'pending';
  page?: number;
  pageSize?: number;
};

export const userItemSchema = z.object({
  id: z.string(),
  username: z.string(),
  display_name: z.string(),
  email: z.string(),
  role: z.enum(['ADMIN', 'HOTEL_PARTNER', 'TRAVELER']),
  is_active: z.boolean(),
  managed_property_id: z.string().nullable().optional(),
  managed_property: z
    .object({
      id: z.string(),
      name: z.string(),
      city: z.string(),
      address: z.string(),
      is_active: z.boolean(),
    })
    .nullable()
    .optional(),
  pending_approval: z.boolean(),
  registration_metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type UserItem = z.infer<typeof userItemSchema>;

export const userListResponseSchema = z.object({
  items: z.array(userItemSchema),
  total: z.number(),
  page: z.number(),
  page_size: z.number(),
  total_pages: z.number(),
  summary: z.object({
    total_users: z.number(),
    total_partners: z.number(),
    total_admins: z.number(),
    total_pending: z.number(),
  }),
});
export type UserListResponse = z.infer<typeof userListResponseSchema>;

export async function listUsers(filter?: UserFilter): Promise<UserListResponse> {
  const params = new URLSearchParams();
  if (filter?.role && filter.role !== 'ALL') params.set('role', filter.role);
  if (filter?.search) params.set('search', filter.search);
  if (filter?.status && filter.status !== 'all') params.set('status', filter.status);
  if (filter?.page) params.set('page', String(filter.page));
  if (filter?.pageSize) params.set('page_size', String(filter.pageSize));

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`/api/admin/users${query}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await parseApiResponse(res, successSchema(userListResponseSchema));
  return data.data;
}

export async function approvePartner(
  userId: string,
  payload: ApprovePartnerPayload,
): Promise<unknown> {
  const res = await fetch(`/api/admin/users/${userId}/approve-partner`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await parseApiResponse(res, successSchema(z.unknown()));
  return data.data;
}

export async function updateUserRole(
  userId: string,
  payload: UpdateUserRolePayload,
): Promise<unknown> {
  const res = await fetch(`/api/admin/users/${userId}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await parseApiResponse(res, successSchema(z.unknown()));
  return data.data;
}

export async function registerPartner(
  payload: RegisterPartnerPayload,
): Promise<{ message: string; account_id: string; status: string }> {
  const res = await fetch('/api/auth/register-partner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await parseApiResponse(
    res,
    successSchema(
      z.object({
        message: z.string(),
        account_id: z.string().optional(),
        status: z.string().optional(),
      }),
    ),
  );
  return data.data as { message: string; account_id: string; status: string };
}

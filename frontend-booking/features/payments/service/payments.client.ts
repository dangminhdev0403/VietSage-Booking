import {
  parseApiResponse,
  paymentListResponseSchema,
  successSchema,
} from '@/lib/api/schemas';

export type ListPaymentsParams = {
  property_id?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

export async function listPayments(params?: ListPaymentsParams) {
  const q = new URLSearchParams();
  if (params?.property_id) q.set('property_id', params.property_id);
  if (params?.status) q.set('status', params.status);
  if (params?.page) q.set('page', String(params.page));
  if (params?.pageSize) q.set('page_size', String(params.pageSize));

  const query = q.toString() ? `?${q.toString()}` : '';
  const res = await fetch(`/api/payments${query}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (res.status === 401) {
    return {
      items: [],
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? 10,
      total: 0,
      has_next: false,
    };
  }

  const data = await parseApiResponse(res, successSchema(paymentListResponseSchema));
  return data.data;
}

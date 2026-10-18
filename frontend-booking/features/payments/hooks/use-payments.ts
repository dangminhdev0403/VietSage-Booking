import { useQuery } from '@tanstack/react-query';
import { paymentsResource } from '../service/payments.resource';
import type { ListPaymentsParams } from '../service/payments.client';

const payments = paymentsResource.bind();

export function usePaymentsQuery(
  params?: ListPaymentsParams,
  options?: { enabled?: boolean },
) {
  const queryOptions = payments.queries.list.options(params);
  return useQuery({
    ...queryOptions,
    ...(options?.enabled !== undefined ? { enabled: options.enabled } : {}),
  });
}

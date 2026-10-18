import { useMutation, useQuery } from '@tanstack/react-query';
import { catalogResource } from '../service/catalog.resource';
import type { PropertyFilter } from '../service/catalog.client';

const catalog = catalogResource.bind();

export function usePropertiesQuery(filter?: PropertyFilter) {
  return useQuery(catalog.queries.properties.options(filter));
}

export function usePropertyDetailQuery(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    ...catalog.queries.propertyDetail.options(id),
    enabled: options?.enabled ?? Boolean(id),
  });
}

export function useServicesQuery(category?: string) {
  return useQuery(catalog.queries.services.options(category));
}

export function usePropertyAllotmentsQuery(
  params: { property_id: string; month?: string },
  options?: { enabled?: boolean },
) {
  const queryOptions = catalog.queries.allotments.options(params);
  return useQuery({
    ...queryOptions,
    enabled: (options?.enabled ?? true) && Boolean(params.property_id),
  });
}

export function useUpdateAllotmentMutation() {
  return useMutation(catalog.mutations.updateAllotment.options());
}

export function useCreatePropertyMutation() {
  return useMutation(catalog.mutations.createProperty.options());
}

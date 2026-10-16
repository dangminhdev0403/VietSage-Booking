import { useQuery } from '@tanstack/react-query';
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

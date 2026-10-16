import {
  createResource,
  defineQuery,
} from '@dangminhdev04032005/query-resource';
import {
  getProperty,
  listProperties,
  listServices,
  type PropertyFilter,
} from './catalog.client';

export const catalogResource = createResource<void>()({
  namespace: ['booking-manager'],
  name: 'catalog',
  scopeKey: () => ['public'],
  queries: {
    properties: defineQuery({
      inputKey: (filter?: PropertyFilter) => [
        filter?.city ?? '',
        filter?.keyword ?? '',
        String(filter?.page ?? 1),
        String(filter?.pageSize ?? 10),
      ],
      queryFn: ({ input }) => listProperties(input),
    }),
    propertyDetail: defineQuery({
      inputKey: (id: string) => [id],
      queryFn: ({ input }) => getProperty(input),
    }),
    services: defineQuery({
      inputKey: (category?: string) => [category ?? 'all'],
      queryFn: ({ input }) => listServices(input === 'all' ? undefined : input),
    }),
  },
  mutations: {},
});

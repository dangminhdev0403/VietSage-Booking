import {
  createResource,
  defineMutation,
  defineQuery,
} from '@dangminhdev04032005/query-resource';
import {
  createProperty,
  getProperty,
  getPropertyAllotments,
  listProperties,
  listServices,
  updateAllotment,
  updateProperty,
  type PropertyFilter,
  type CreatePropertyPayload,
  type UpdatePropertyPayload,
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
    allotments: defineQuery({
      inputKey: (params: { property_id: string; month?: string }) => [
        params.property_id,
        params.month ?? '',
      ],
      queryFn: ({ input }) => getPropertyAllotments(input.property_id, input.month),
    }),
  },
  mutations: {
    updateAllotment: defineMutation({
      mutationFn: ({
        variables,
      }: {
        variables: {
          room_type_id: string;
          date: string;
          total_rooms?: number;
          price?: number;
          is_blocked?: boolean;
        };
      }) => updateAllotment(variables),
      invalidates: [{ type: 'query', operation: 'allotments' }],
    }),
    createProperty: defineMutation({
      mutationFn: ({
        variables,
      }: {
        variables: CreatePropertyPayload;
      }) => createProperty(variables),
      invalidates: [{ type: 'query', operation: 'properties' }],
    }),
    updateProperty: defineMutation({
      mutationFn: ({
        variables,
      }: {
        variables: {
          id: string;
          payload: UpdatePropertyPayload;
        };
      }) => updateProperty(variables.id, variables.payload),
      invalidates: [
        { type: 'query', operation: 'propertyDetail' },
        { type: 'query', operation: 'properties' },
      ],
    }),
  },
});

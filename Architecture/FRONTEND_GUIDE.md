# Frontend Architecture Guide

## 1. Overview

`frontend-booking` is a Next.js 16 App Router application engineered for high-converting, intuitive, and lightning-fast OTA booking journeys.

## 2. Target Directory Structure

```txt
frontend-booking/
├── app/
│   ├── (public)/                 # Guest facing search, discovery, and booking
│   │   ├── properties/
│   │   ├── checkout/
│   │   └── page.tsx              # OTA Hero, destination search, deals
│   ├── admin/                    # Partner & platform operator shell
│   │   ├── properties/
│   │   ├── bookings/
│   │   ├── services/
│   │   └── page.tsx
│   ├── api/                      # Next.js BFF Route Handlers
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── layouts/                  # Navigation, header, footer
│   └── shared/                   # Atomic presentation primitives (Button, Modal, Card)
├── features/
│   ├── auth/                     # Authentication & session feature
│   ├── catalog/                  # Property, room type, and add-on services
│   ├── inventory/                # Rates calendar and allotments
│   └── bookings/                 # Booking list, checkout wizard, status management
├── lib/
│   ├── api/                      # Backend client, fetch wrappers, and Zod schemas
│   ├── query/                    # TanStack QueryClient and QueryProvider
│   └── store/                    # Zustand stores with safe persistent storage
└── config/
    └── share_api.json            # Synchronized contract mirror
```

## 3. Server-State Standard Pattern

All remote server data fetching and mutations must follow the 4-layer standard:

```txt
1. Feature API Client (lib/api/backend.ts + features/[domain]/service/[domain].client.ts)
   ↓
2. Query Resource (features/[domain]/service/[domain].resource.ts via @dangminhdev04032005/query-resource)
   ↓
3. Feature Hook (features/[domain]/hooks/use-[domain].ts)
   ↓
4. UI Component (features/[domain]/components/[component].tsx)
```

Example Resource:
```typescript
import { createResource, defineQuery, defineMutation } from "@dangminhdev04032005/query-resource";
import { listProperties, getProperty } from "./catalog.client";

export const propertyResource = createResource<void>()({
  namespace: ["booking-manager"],
  name: "properties",
  scopeKey: () => ["public"],
  queries: {
    list: defineQuery({
      inputKey: (filter?: PropertyFilter) => [filter?.city ?? "", filter?.keyword ?? ""],
      queryFn: ({ input }) => listProperties(input),
    }),
    detail: defineQuery({
      inputKey: (id: string) => [id],
      queryFn: ({ input }) => getProperty(input),
    }),
  },
  mutations: { /* ... */ }
});
```

## 4. UI Copywriting & Design Standards

- **Hospitality-Grade UX**: Warm, clear, trustworthy, and conversion-optimized.
- **Clean Vietnamese & English**: No colloquial slang, no technical developer jargon or raw error codes displayed to guests.
- **Feedback & Notifications**: Crisp modals, clear loading skeletons, and informative empty/error states with retry buttons.

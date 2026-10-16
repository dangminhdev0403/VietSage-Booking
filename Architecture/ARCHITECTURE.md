# booking-manager Architecture (OTA Platform)

## 1. Executive Summary

`booking-manager` is a high-performance, user-friendly **Online Travel Agency (OTA) Platform** designed to offer seamless booking experiences for travelers, hotel partners, and operators.

It is architected as a **modular monolith at the backend core** with a reactive, modern **Next.js 16 frontend presentation layer**, tightly integrated with the **VietSage** hospitality management ecosystem (`fullstack-vietSage`).

## 2. Runtime Model

| Layer | Technology | Role & Ownership Rules |
| --- | --- | --- |
| **Workspace** | Product Monorepo | Contains frontend, backend, shared contracts, and architecture documentation. |
| **Web Presentation** | Next.js 16 + React 19 + Tailwind CSS 4 | Owns UI, customer-facing booking flows, partner portals, and BFF route handlers. Does not contain raw business logic or direct database connections. |
| **API Core** | NestJS 11 Modular Monolith | Owns business rules, booking state machines, pricing engines, authorization, persistence, and external sync adapters. |
| **Database** | PostgreSQL + Prisma ORM | Exclusively owned by `backend-booking`. No frontend direct access. |
| **Contract Boundary** | Versioned HTTP API (`/api/v1`) | The authoritative integration boundary between frontend and backend. Synchronized with OpenAPI specs. |
| **Ecosystem Sync** | VietSage Connector (ACL) | Synchronizes property catalog, room allotments, dynamic rates, and pushes confirmed bookings to `fullstack-vietSage`. |

## 3. Repository Shape

```txt
booking-manager/
├── Architecture/         # Architecture guides, rules, and plans
├── shared/
│   └── api-contract/     # OpenAPI v1 specs, sync scripts, and Zod schemas
├── backend-booking/      # NestJS modular monolith
├── frontend-booking/     # Next.js web application
├── AGENTS.md             # Coding instructions & boundaries
├── share_api.json        # Contract catalog mirror
└── .gitignore            # Git exclusions
```

## 4. Dependency Direction

```txt
Customer / Hotel Partner / Admin
  ↓
Next.js 16 App Router (Server/Client Components)
  ↓
Feature Hook (useQuery / useMutation)
  ↓
Query Resource (@dangminhdev04032005/query-resource)
  ↓
Feature API Client + Zod Schema Validation
  ↓
BFF Route / Versioned HTTP API (/api/v1)
  ↓
NestJS Controller (Thin HTTP Mapping & DTO validation)
  ↓
Bounded-Context Application Service (Domain logic & workflows)
  ↓
Owning Module Prisma Persistence / VietSage Integration Port
```

## 5. Bounded Context Direction

The backend starts as one modular NestJS process with explicit bounded contexts:

1. **Identity & Access**: Accounts, roles (Traveler, Hotel Partner, OTA Admin), JWT authentication, refresh sessions, and audit logging.
2. **Catalog & Services**: Hotel properties, room types, amenities, and add-on services (Airport transfer, Breakfast, Spa, Tours).
3. **Inventory & Dynamic Rates**: Daily room availability allotments, pricing tiers, seasonal markups, and promotions.
4. **Booking Engine**: Reservation lifecycle (`PENDING` → `CONFIRMED` → `CHECKED_IN` → `COMPLETED` / `CANCELLED`), booking code generation (`OTA-xxxx`), rate calculation, and payment receipts.
5. **Customer Management**: Traveler profiles, booking histories, and travel preferences.
6. **VietSage Sync Connector**: Anti-Corruption Layer (ACL) for bi-directional synchronization with `fullstack-vietSage`.

## 6. Contract Boundary

`shared/api-contract/openapi/v1/openapi.json` is the authoritative API contract.
- External JSON payloads use `snake_case`.
- Internal TypeScript, NestJS, and Prisma models use `camelCase`.
- Envelope policy:
  - Success: `{ success: true, data: ..., meta: ... }`
  - Failure: `{ success: false, error: { code, message, details }, request_id }`
- Contract changes must update OpenAPI, run verification, and update client implementations in the same changeset.

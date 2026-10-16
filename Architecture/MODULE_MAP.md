# Bounded Context Module Map

This document defines the domain boundaries, entity ownership, and inter-module communication for **booking-manager**.

## 1. Bounded Context Ownership Table

| Bounded Context | NestJS Module | Owned Prisma Models | Key Responsibilities | Public Ports / Exported Services |
| --- | --- | --- | --- | --- |
| **Identity & Access** | `IdentityAccessModule` | `Account`, `Role`, `Permission`, `RolePermission`, `AccountRoleAssignment`, `RefreshSession`, `AuditEvent` | Authentication, JWT issue/refresh, password hashing, RBAC permissions, audit events. | `AuthService`, `AccountService`, `AuditService` |
| **Catalog & Services** | `CatalogModule` | `Property`, `RoomType`, `AddonService`, `PropertyAmenity` | Properties/Hotels, Room configurations, Pricing policies, Add-on services (Airport pick-up, Breakfast, Spa, Tours). | `CatalogService`, `RoomTypeService` |
| **Inventory & Rates** | `InventoryRatesModule` | `RoomAllotment`, `RatePlan`, `DailyRate` | Room availability allotments, dynamic calendar pricing, blackout dates. | `InventoryRatesService` |
| **Booking Engine** | `BookingsModule` | `Booking`, `BookingItem`, `BookingGuest`, `BookingAddon` | Reservation lifecycle (`PENDING`, `CONFIRMED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED`), booking code generator, price calculation. | `BookingsService` |
| **Customer Management** | `CustomerModule` | `CustomerProfile`, `TravelerPreference` | Traveler details, contact info, booking history summary, loyalty tags. | `CustomerService` |
| **VietSage Connector (ACL)** | `VietSageSyncModule` | `VietSageSyncLog`, `PropertyMapping` | Synchronizes inventory and rate plans with `fullstack-vietSage`, pushes confirmed OTA bookings to VietSage PMS. | `VietSageSyncService` |

## 2. Dependency & Invariant Rules

1. **No Shared Writes**: No module may directly execute Prisma `create`, `update`, or `delete` on models owned by another context.
2. **Cross-Domain Reference by ID**: Domains must reference other domains via opaque IDs (e.g., `accountId`, `propertyId`, `roomTypeId`), not via direct database foreign joins across module boundaries.
3. **Booking Invariant**: A booking cannot be confirmed without verifying room availability in `InventoryRatesModule`.
4. **Audit Invariant**: Any state mutation to a booking or role permission must emit an `AuditEvent` via `AuditService`.
5. **VietSage Isolation**: External VietSage data structures must be mapped through the `VietSageSyncModule` Anti-Corruption Layer before entering internal domain workflows.

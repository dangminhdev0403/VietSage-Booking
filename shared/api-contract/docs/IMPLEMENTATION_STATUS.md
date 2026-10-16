# API Implementation Status

Tracking authoritative status against `openapi.json`.

`implemented` records an existing local route/workflow, not production readiness. `planned` includes provider stubs without a real external call.

| Endpoint | Method | Status | Backend Controller | Frontend Client |
| --- | --- | --- | --- | --- |
| `/api/v1/auth/login` | POST | `implemented` | `AuthController.login` | `auth.client.ts` |
| `/api/v1/auth/register` | POST | `implemented` | `AuthController.register` | `auth.client.ts` |
| `/api/v1/auth/refresh` | POST | `implemented` | `AuthController.refresh` | `auth.client.ts` |
| `/api/v1/auth/me` | GET | `implemented` | `AuthController.me` | `auth.client.ts` |
| `/api/v1/properties` | GET, POST | `implemented` | `CatalogController` | `catalog.client.ts` |
| `/api/v1/properties/{id}` | GET | `implemented` | `CatalogController.getById` | `catalog.client.ts` |
| `/api/v1/services` | GET, POST | `implemented` | `ServicesController` | `catalog.client.ts` |
| `/api/v1/bookings` | GET, POST | `implemented` | `BookingsController` | `bookings.client.ts` |
| `/api/v1/bookings/{id}` | GET | `implemented` | `BookingsController.getById` | `bookings.client.ts` |
| `/api/v1/bookings/{id}/status` | PATCH | `implemented` | `BookingsController.updateStatus` (local CANCELLED only) | `bookings.client.ts` (via BFF) |
| `/api/v1/vietsage/sync` | POST | `planned` | Fail-closed stub (501 Not Implemented); requires ADMIN role | `vietsage.client.ts` |

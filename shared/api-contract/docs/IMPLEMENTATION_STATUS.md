# API Implementation Status

Tracking authoritative status against `openapi.json`.

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
| `/api/v1/bookings/{id}/status` | PATCH | `implemented` | `BookingsController.updateStatus` | `bookings.client.ts` |
| `/api/v1/vietsage/sync` | POST | `implemented` | `VietSageSyncController.sync` | `vietsage.client.ts` |

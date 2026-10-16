# API Catalog: booking-manager (OTA Platform)

Authoritative specification: `shared/api-contract/openapi/v1/openapi.json`.

## Endpoints Summary

| Method | Path | Summary | Implementation Status | Scope / Role |
| --- | --- | --- | --- | --- |
| `POST` | `/api/v1/auth/login` | Authenticate user and issue tokens | `implemented` | Public |
| `POST` | `/api/v1/auth/register` | Register new traveler or partner account | `implemented` | Public |
| `POST` | `/api/v1/auth/refresh` | Refresh access token using refresh token | `implemented` | Public |
| `GET` | `/api/v1/auth/me` | Get current user profile and active permissions | `implemented` | Authenticated |
| `GET` | `/api/v1/properties` | List properties with destination & date filtering | `implemented` | Public |
| `POST` | `/api/v1/properties` | Create a new property | `implemented` | Partner / Admin |
| `GET` | `/api/v1/properties/{id}` | Get detailed property information by ID | `implemented` | Public |
| `GET` | `/api/v1/services` | List add-on travel and hospitality services | `implemented` | Public |
| `POST` | `/api/v1/services` | Create an add-on service | `implemented` | Partner / Admin |
| `GET` | `/api/v1/bookings` | List bookings for traveler, partner, or admin | `implemented` | Authenticated |
| `POST` | `/api/v1/bookings` | Create a new OTA booking | `implemented` | Traveler / Public |
| `GET` | `/api/v1/bookings/{id}` | Get booking details by ID or booking code | `implemented` | Authenticated |
| `PATCH` | `/api/v1/bookings/{id}/status` | Update reservation status (confirmed, cancelled) | `implemented` | Partner / Admin |
| `POST` | `/api/v1/vietsage/sync` | Trigger bi-directional sync with VietSage PMS | `implemented` | Admin / Internal |

# Contract Changes Log

## Version 1.0.0 (2026-10-16)

- Baseline v1 contract initialized for **booking-manager (OTA Platform)**.
- Established 11 core routes across Identity/Auth, Property/Services Catalog, OTA Booking Engine, and VietSage Sync.
- Enforced envelope standards: `{ success: true, data: ..., meta: ... }` and `{ success: false, error: ... }`.
- Verified parity between `openapi.json`, `openapi.yaml`, and mirror catalogs.

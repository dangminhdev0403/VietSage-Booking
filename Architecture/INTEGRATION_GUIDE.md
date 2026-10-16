# Integration Guide: booking-manager & VietSage

## 1. Context & Purpose

`booking-manager` is the **Online Travel Agency (OTA)** frontend and booking distribution channel, while **VietSage** (`C:\Users\Dangminhdev0403\Desktop\workspace\fullstack-vietSage`) is the core **Hospitality & Property Management System (PMS)**.

This guide defines how `booking-manager` connects, synchronizes, and communicates with `fullstack-vietSage`.

## 2. Integration Architecture: Anti-Corruption Layer (ACL)

To prevent external VietSage schemas from leaking directly into `booking-manager` domain services, all communication is routed through the **VietSage Connector / ACL** (`src/modules/vietsage-sync/`).

```txt
┌──────────────────────────────────────┐          ┌──────────────────────────────────────┐
│           booking-manager            │          │          fullstack-vietSage          │
│                                      │          │                                      │
│  [Catalog] ──► [VietSageSyncService] │ ◄──────► │  [PMS Core / Auth Service]          │
│                       │              │  HTTPS   │  - Hotel & Room Catalog              │
│                       ▼              │ Webhooks │  - Real-time Allotments & Rates      │
│               [VietSageSyncLog]      │          │  - Front Desk Reservation Ingestion  │
└──────────────────────────────────────┘          └──────────────────────────────────────┘
```

## 3. Core Synchronization Flows

### Flow 1: Property & Inventory Sync (VietSage → OTA)
1. **Trigger**: Scheduled cron job or VietSage webhook notification (`property.updated`, `rates.updated`).
2. **Action**: `VietSageSyncService` fetches latest room categories, photos, amenities, and rate plans.
3. **Mapping**: Translates VietSage models into `Property`, `RoomType`, `AddonService`, and `RoomAllotment`.
4. **Audit**: Records transaction in `VietSageSyncLog`.

### Flow 2: Reservation Push (OTA → VietSage)
1. **Trigger**: Traveler confirms booking on OTA platform (`BookingEngineModule`).
2. **Payload**:
   ```json
   {
     "ota_booking_code": "OTA-202610-8912",
     "vietsage_hotel_id": "hotel-uuid",
     "guest_name": "Nguyen Van A",
     "guest_phone": "+84901234567",
     "guest_email": "traveler@example.com",
     "check_in": "2026-11-01",
     "check_out": "2026-11-04",
     "room_type_id": "room-type-uuid",
     "rooms_count": 1,
     "adults": 2,
     "children": 0,
     "total_amount": 4500000,
     "currency": "VND",
     "special_requests": "Tầng cao, phòng không hút thuốc"
   }
   ```
3. **Resilience**: If VietSage is temporarily unreachable, the booking status is held as `CONFIRMED_LOCAL` with an exponential backoff retry queue (`sync_status = PENDING_RETRY`).

## 4. Configuration & Environment Variables

```env
# VietSage Integration Settings
VIETSAGE_API_BASE_URL="http://localhost:4000/api/v1"
VIETSAGE_PARTNER_API_KEY="vietsage_partner_secret_key"
VIETSAGE_WEBHOOK_SECRET="vietsage_webhook_signing_secret"
VIETSAGE_SYNC_INTERVAL_MINUTES=15
```

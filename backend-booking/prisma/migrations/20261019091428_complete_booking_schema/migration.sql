-- Bring the migration chain in sync with the current OTA schema.

-- Remove the retired SUPER_ADMIN enum value after the prior migration reassigns accounts.
BEGIN;
CREATE TYPE "AccountRole_new" AS ENUM ('ADMIN', 'HOTEL_PARTNER', 'TRAVELER');
ALTER TABLE "accounts" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "accounts" ALTER COLUMN "role" TYPE "AccountRole_new" USING ("role"::text::"AccountRole_new");
ALTER TYPE "AccountRole" RENAME TO "AccountRole_old";
ALTER TYPE "AccountRole_new" RENAME TO "AccountRole";
DROP TYPE "AccountRole_old";
ALTER TABLE "accounts" ALTER COLUMN "role" SET DEFAULT 'TRAVELER';
COMMIT;

ALTER TYPE "BookingStatus" ADD VALUE 'CONFIRMING';
ALTER TYPE "BookingStatus" ADD VALUE 'EXPIRED';

ALTER TYPE "PaymentStatus" ADD VALUE 'DEPOSIT_PAID';
ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIALLY_REFUNDED';

ALTER TYPE "PaymentTransactionStatus" ADD VALUE 'OPEN';
ALTER TYPE "PaymentTransactionStatus" ADD VALUE 'EXPIRED';
ALTER TYPE "PaymentTransactionStatus" ADD VALUE 'REFUND_PENDING';
ALTER TYPE "PaymentTransactionStatus" ADD VALUE 'REFUNDED';

ALTER TABLE "bookings"
ADD COLUMN "addon_subtotal" INTEGER,
ADD COLUMN "balance_due" INTEGER,
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'VND',
ADD COLUMN "deposit_amount" INTEGER,
ADD COLUMN "deposit_rate_bps" INTEGER NOT NULL DEFAULT 3000,
ADD COLUMN "hold_expires_at" TIMESTAMP(3),
ADD COLUMN "hold_id" TEXT,
ADD COLUMN "idempotency_key" TEXT,
ADD COLUMN "lookup_token_hash" TEXT,
ADD COLUMN "request_fingerprint" TEXT,
ADD COLUMN "room_subtotal" INTEGER,
ADD COLUMN "vietsage_reservation_id" TEXT;

ALTER TABLE "payments"
ADD COLUMN "expires_at" TIMESTAMP(3),
ADD COLUMN "provider_name" TEXT NOT NULL DEFAULT 'STRIPE_LOCALMATE',
ADD COLUMN "provider_payment_id" TEXT,
ADD COLUMN "provider_session_id" TEXT,
ADD COLUMN "purpose" TEXT NOT NULL DEFAULT 'DEPOSIT',
ADD COLUMN "raw_metadata" JSONB,
ADD COLUMN "refunded_amount" INTEGER;

ALTER TABLE "properties" ADD COLUMN "vietsage_hotel_id" TEXT;

ALTER TABLE "room_types"
ADD COLUMN "area_sqm" DOUBLE PRECISION,
ADD COLUMN "bed_count" INTEGER,
ADD COLUMN "bed_type" TEXT,
ADD COLUMN "booking_conditions" JSONB,
ADD COLUMN "has_sea_view" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "room_images" JSONB,
ADD COLUMN "vietsage_room_type_id" TEXT;

ALTER TABLE "vietsage_sync_logs"
ADD COLUMN "attempt_count" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "booking_id" TEXT,
ADD COLUMN "idempotency_key" TEXT,
ADD COLUMN "operation_key" TEXT;

CREATE TABLE "payment_webhook_events" (
    "id" TEXT NOT NULL,
    "provider_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "error" TEXT,
    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_webhook_events_provider_event_id_key" ON "payment_webhook_events"("provider_event_id");
CREATE INDEX "payment_webhook_events_event_type_idx" ON "payment_webhook_events"("event_type");
CREATE INDEX "accounts_managed_property_id_idx" ON "accounts"("managed_property_id");
CREATE INDEX "booking_addons_booking_id_idx" ON "booking_addons"("booking_id");
CREATE INDEX "booking_addons_addon_service_id_idx" ON "booking_addons"("addon_service_id");
CREATE UNIQUE INDEX "bookings_idempotency_key_key" ON "bookings"("idempotency_key");
CREATE INDEX "bookings_property_id_status_idx" ON "bookings"("property_id", "status");
CREATE INDEX "bookings_account_id_idx" ON "bookings"("account_id");
CREATE INDEX "bookings_status_created_at_idx" ON "bookings"("status", "created_at");
CREATE INDEX "bookings_lookup_token_hash_idx" ON "bookings"("lookup_token_hash");
CREATE UNIQUE INDEX "payments_provider_session_id_key" ON "payments"("provider_session_id");
CREATE INDEX "payments_provider_session_id_idx" ON "payments"("provider_session_id");
CREATE INDEX "payments_status_created_at_idx" ON "payments"("status", "created_at");
CREATE UNIQUE INDEX "properties_vietsage_hotel_id_key" ON "properties"("vietsage_hotel_id");
CREATE INDEX "properties_is_active_city_idx" ON "properties"("is_active", "city");
CREATE INDEX "room_types_property_id_idx" ON "room_types"("property_id");
CREATE INDEX "room_types_property_id_is_active_base_price_idx" ON "room_types"("property_id", "is_active", "base_price");
CREATE UNIQUE INDEX "vietsage_sync_logs_operation_key_key" ON "vietsage_sync_logs"("operation_key");
CREATE INDEX "vietsage_sync_logs_booking_id_idx" ON "vietsage_sync_logs"("booking_id");

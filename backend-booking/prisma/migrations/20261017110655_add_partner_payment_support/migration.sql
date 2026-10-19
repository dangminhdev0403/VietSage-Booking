-- Add partner property ownership and payment transactions.
BEGIN;

CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'PAY_AT_HOTEL', 'STRIPE_LOCALMATE', 'CARD');
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

ALTER TABLE "accounts" ADD COLUMN "managed_property_id" TEXT;

CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'STRIPE_LOCALMATE',
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "status" "PaymentTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "transaction_ref" TEXT NOT NULL,
    "qr_code_url" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payments_transaction_ref_key" ON "payments"("transaction_ref");
CREATE INDEX "payments_booking_id_idx" ON "payments"("booking_id");
CREATE INDEX "payments_transaction_ref_idx" ON "payments"("transaction_ref");

ALTER TABLE "accounts"
ADD CONSTRAINT "accounts_managed_property_id_fkey"
FOREIGN KEY ("managed_property_id") REFERENCES "properties"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payments"
ADD CONSTRAINT "payments_booking_id_fkey"
FOREIGN KEY ("booking_id") REFERENCES "bookings"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;

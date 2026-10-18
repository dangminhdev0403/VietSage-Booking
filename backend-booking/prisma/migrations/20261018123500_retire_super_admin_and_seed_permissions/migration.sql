-- Migration: 20261018123500_retire_super_admin_and_seed_permissions
-- Description: Retire SUPER_ADMIN role/account, migrate accounts to ADMIN, and seed granular Role-Permission capabilities.

BEGIN;

-- 1. Migrate any existing SUPER_ADMIN accounts to ADMIN
UPDATE "accounts"
SET "role" = 'ADMIN'
WHERE "role"::text = 'SUPER_ADMIN';

-- 2. Remove legacy superadmin account and role
DELETE FROM "account_role_assignments"
WHERE "account_id" IN (SELECT id FROM "accounts" WHERE "username" = 'superadmin')
   OR "role_id" IN (SELECT id FROM "roles" WHERE "code" = 'SUPER_ADMIN');

DELETE FROM "role_permissions"
WHERE "role_id" IN (SELECT id FROM "roles" WHERE "code" = 'SUPER_ADMIN');

DELETE FROM "accounts"
WHERE "username" = 'superadmin';

DELETE FROM "roles"
WHERE "code" = 'SUPER_ADMIN';

-- 3. Ensure ADMIN and HOTEL_PARTNER roles exist in roles table
INSERT INTO "roles" ("id", "code", "name", "description", "is_system", "is_active", "created_at", "updated_at")
VALUES
  (gen_random_uuid()::text, 'ADMIN', 'Platform Administrator', 'Toàn quyền quản trị sàn OTA', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'HOTEL_PARTNER', 'Hotel & Property Partner', 'Đối tác quản lý khách sạn và tồn kho', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name",
    "is_system" = true,
    "is_active" = true,
    "updated_at" = CURRENT_TIMESTAMP;

-- 4. Seed Granular Permissions
INSERT INTO "permissions" ("id", "key", "label", "description", "bounded_context", "created_at", "updated_at")
VALUES
  (gen_random_uuid()::text, 'admin:access', 'Truy cập Admin', 'Quyền truy cập khu vực quản trị', 'identity-access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'catalog:read', 'Xem danh mục', 'Xem danh sách khách sạn và phòng', 'catalog', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'catalog:manage', 'Quản lý danh mục', 'Tạo, sửa khách sạn và hạng phòng', 'catalog', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'allotments:read', 'Xem tồn kho', 'Xem lịch allotment và giá phòng', 'catalog', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'allotments:manage', 'Quản lý tồn kho', 'Cập nhật allotment và quota phòng', 'catalog', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'bookings:read', 'Xem đơn đặt', 'Xem danh sách đơn đặt phòng', 'bookings', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'bookings:manage', 'Quản lý đơn đặt', 'Cập nhật và hủy đơn đặt phòng', 'bookings', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'payments:read', 'Xem thanh toán', 'Xem giao dịch thanh toán và đối soát', 'payments', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'payments:manage', 'Quản lý thanh toán', 'Xử lý hoàn tiền và đối soát giao dịch', 'payments', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'sync:manage', 'Đồng bộ VietSage', 'Kích hoạt đồng bộ tồn kho từ VietSage PMS', 'vietsage-sync', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE
SET "label" = EXCLUDED."label",
    "description" = EXCLUDED."description",
    "bounded_context" = EXCLUDED."bounded_context",
    "updated_at" = CURRENT_TIMESTAMP;

-- 5. Map permissions to ADMIN role (Full OTA Platform Capabilities)
INSERT INTO "role_permissions" ("role_id", "permission_key", "assigned_at")
SELECT r.id, p.key, CURRENT_TIMESTAMP
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r.code = 'ADMIN'
ON CONFLICT ("role_id", "permission_key") DO NOTHING;

-- 6. Map permissions to HOTEL_PARTNER role (Property Scoped Capabilities)
INSERT INTO "role_permissions" ("role_id", "permission_key", "assigned_at")
SELECT r.id, p.key, CURRENT_TIMESTAMP
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r.code = 'HOTEL_PARTNER'
  AND p.key IN (
    'admin:access',
    'catalog:read',
    'catalog:manage',
    'allotments:read',
    'allotments:manage',
    'bookings:read',
    'bookings:manage',
    'payments:read'
  )
ON CONFLICT ("role_id", "permission_key") DO NOTHING;

-- 7. Ensure Account Role Assignments for platform admin and partners
INSERT INTO "account_role_assignments" ("account_id", "role_id", "assigned_at")
SELECT a.id, r.id, CURRENT_TIMESTAMP
FROM "accounts" a
JOIN "roles" r ON r.code = 'ADMIN'
WHERE a.username = 'admin'
ON CONFLICT ("account_id", "role_id") DO NOTHING;

INSERT INTO "account_role_assignments" ("account_id", "role_id", "assigned_at")
SELECT a.id, r.id, CURRENT_TIMESTAMP
FROM "accounts" a
JOIN "roles" r ON r.code = 'HOTEL_PARTNER'
WHERE a.role = 'HOTEL_PARTNER'
ON CONFLICT ("account_id", "role_id") DO NOTHING;

COMMIT;

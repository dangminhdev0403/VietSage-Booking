# VietSage-Booking

Hệ thống Đặt phòng Trực tuyến (Online Travel Agency - OTA Booking Manager) tích hợp đồng bộ theo thời gian thực với hệ sinh thái VietSage PMS.

## 1. Tổng quan Kiến trúc

- **Kiến trúc**: Microservices-ready monorepo với Authoritative OpenAPI Contract-First (`shared/api-contract/`).
- **Design System**: Kế thừa trực tiếp từ Stitch Project `7411068166474105979` (**Aurum Haven** - Quiet Luxury / Warm Editorial Minimalism).
- **Backend (`backend-booking`)**:
  - NestJS 11 + Prisma ORM + PostgreSQL (`vietsage_booking` trên container `vietsage-postgres`).
  - Vertical slices: Identity/Access (JWT, RBAC), Catalog, Bookings, VietSageSync (ACL Adapter).
  - Global filters, standard response envelopes (`ApiSuccessEnvelope`, `ApiErrorEnvelope`), audit logging.
- **Frontend (`frontend-booking`)**:
  - Next.js 16 (App Router, Turbopack) + Tailwind CSS 4.
  - Server-state pattern: `@dangminhdev04032005/query-resource` + `@tanstack/react-query` + Zustand.
  - Google Fonts: `Playfair Display` (Headlines) + `Plus Jakarta Sans` (Body & Labels).
  - Khám phá điểm đến (Bento Grid), đặt phòng trực tiếp (Instant Reservation), kênh quản trị đối tác (`/admin`).

## 2. Cấu trúc Dự án

```
booking-manager/
├── Architecture/                  # Tài liệu kiến trúc, quy tắc, bản đồ module và kế hoạch
│   ├── ARCHITECTURE.md
│   ├── RULES.md
│   ├── MODULE_MAP.md
│   ├── FRONTEND_GUIDE.md
│   ├── BACKEND_GUIDE.md
│   ├── INTEGRATION_GUIDE.md
│   └── PLANS.md
├── shared/
│   └── api-contract/              # Authoritative OpenAPI Contract v1
│       ├── openapi/v1/openapi.json
│       ├── openapi/v1/openapi.yaml
│       ├── schemas/zod-schemas.ts
│       └── scripts/verify-contract.cjs
├── backend-booking/               # NestJS Backend API & Prisma ORM
│   ├── src/
│   │   ├── modules/ (identity-access, catalog, bookings, vietsage-sync, prisma)
│   │   └── common/ (filters, guards, decorators, interceptors)
│   └── prisma/
└── frontend-booking/              # Next.js 16 OTA Frontend & Stitch Design System
    ├── app/ (page.tsx, layout.tsx, globals.css, admin/page.tsx)
    ├── features/ (catalog, bookings)
    └── lib/ (api, query, store)
```

## 3. Hướng dẫn Khởi chạy

### Cơ sở dữ liệu (PostgreSQL)
Cấu hình kết nối cơ sở dữ liệu `DATABASE_URL` trong `backend-booking/.env`:
```env
DATABASE_URL="postgresql://postgres:root@localhost:5432/vietsage_booking?schema=public"
JWT_SECRET="vietsage_super_secret_jwt_key_2026"
PORT=3001
VIETSAGE_PMS_BASE_URL="http://localhost:3000/api/v1"
```

Đẩy schema và seed dữ liệu mẫu:
```bash
cd backend-booking
npx prisma db push
npm run db:seed
```

### Khởi chạy Backend
```bash
cd backend-booking
npm run start:dev
# API chạy tại http://localhost:3001
```

### Khởi chạy Frontend
```bash
cd frontend-booking
pnpm run dev
# Web chạy tại http://localhost:3002
```

## 4. Xác thực Hợp đồng (Contract Parity)
```bash
node shared/api-contract/scripts/verify-contract.cjs
```

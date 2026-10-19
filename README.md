# VietSage-Booking

Hệ thống Đặt phòng Trực tuyến (Online Travel Agency - OTA Booking Manager) tích hợp VietSage PMS qua API contract và Anti-Corruption Layer (ACL).

## 1. Tổng quan Kiến trúc

- **Kiến trúc**: OTA modular monolith, service-ready boundary, Authoritative OpenAPI Contract-First (`shared/api-contract/`).
- **Design System**: Kế thừa trực tiếp từ Stitch Project `7411068166474105979` (**Aurum Haven** - Quiet Luxury / Warm Editorial Minimalism).
- **Backend (`backend-booking`)**:
  - NestJS 11 + Prisma ORM + database PostgreSQL riêng của OTA. Production tạm dùng chung PostgreSQL instance VietSage nhưng tách database/role.
  - Vertical slices: Identity/Access, Catalog Projection, Booking Commerce, VietSageSync (ACL Adapter).
  - Global filters, standard response envelopes (`ApiSuccessEnvelope`, `ApiErrorEnvelope`), audit logging.
- **Frontend (`frontend-booking`)**:
  - Next.js 16 (App Router, Turbopack) + Tailwind CSS 4.
  - Server-state pattern: `@dangminhdev04032005/query-resource` + `@tanstack/react-query` + Zustand.
  - Google Fonts: `Playfair Display` (Headlines) + `Plus Jakarta Sans` (Body & Labels).
  - Khám phá điểm đến, gửi yêu cầu đặt phòng, customer self-service và kênh quản trị đối tác (`/admin`).

VietSage là nguồn có thẩm quyền cho tồn/giá/restriction, phòng vật lý, reservation/stay và check-in/out. `booking-manager` không dùng chung DB với VietSage; xem [`Architecture/ARCHITECTURE.md`](Architecture/ARCHITECTURE.md) và [`Architecture/INTEGRATION_GUIDE.md`](Architecture/INTEGRATION_GUIDE.md).

## 2. Cấu trúc Dự án

```
booking-manager/
├── Architecture/                  # Tài liệu kiến trúc, quy tắc, bản đồ module và kế hoạch
│   ├── ARCHITECTURE.md
│   ├── RULES.md
│   ├── MODULE_MAP.md
│   ├── FRONTEND_GUIDE.md
│   ├── BACKEND_GUIDE.md
│   ├── CONTRACT_GUIDE.md
│   ├── GRAPHIFY_GUIDE.md
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
DATABASE_URL="postgresql://booking_user:booking_password@localhost:5434/booking_db?schema=public"
JWT_SECRET="development_jwt_secret_at_least_32_characters"
PORT=8081
CORS_ORIGINS="http://localhost:3000"
VIETSAGE_API_BASE_URL="http://localhost:8080"
VIETSAGE_HMAC_SECRET="development_hmac_secret_at_least_32_characters"
```

Môi trường phát triển mới có thể chạy migration và seed dữ liệu mẫu:
```bash
cd backend-booking
npx prisma migrate deploy
npm run db:seed
```

Production chỉ chạy `prisma migrate deploy`; không chạy demo seed. Xem [`Architecture/DEPLOYMENT_GUIDE.md`](Architecture/DEPLOYMENT_GUIDE.md).

### Khởi chạy Backend
```bash
cd backend-booking
npm run start:dev
# API chạy tại http://localhost:8081
```

### Khởi chạy Frontend
```bash
cd frontend-booking
pnpm run dev
# Web chạy tại http://localhost:3000
```

## 4. Xác thực Hợp đồng (Contract Parity)
```bash
node shared/api-contract/scripts/verify-contract.cjs
```

## 5. Rà soát code bằng Graphify

Graphify được cài bằng `uv tool`, không thêm dependency ứng dụng:

```bash
uv tool install --upgrade graphifyy
env -u PYTHONPATH graphify update .
env -u PYTHONPATH graphify explain "BookingsService" --all
```

Output local nằm tại `graphify-out/` và bị Git ignore. Workflow đầy đủ: [`Architecture/GRAPHIFY_GUIDE.md`](Architecture/GRAPHIFY_GUIDE.md).

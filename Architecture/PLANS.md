# Forward Engineering Roadmap: booking-manager (OTA Platform)

> Forward engineering roadmap only. Lịch sử phân phối chi tiết thuộc về Git commit và Báo cáo nghiệm thu (Final Report). Tuyệt đối không ghi nhật ký hoàn tất vi mô hoặc append checklist task đã xong vào đây.

## 1. System Baseline

Nền tảng OTA đã có baseline scaffold và full-stack prototype. Các nhãn dưới đây không thay runtime verification hoặc production-readiness gates:
- **Architecture & Contracts**: Monorepo NestJS + Next.js 16 App Router, authoritative OpenAPI v1 contract (`openapi.json`), đồng bộ status.
- **Identity & Access**: Full-stack Passport.js (Local/JWT) + Auth.js v5 Credentials Provider, session state, granular Role & Permission capabilities (`ADMIN`, `HOTEL_PARTNER`, `TRAVELER`).
- **Catalog & Booking Engine**: Schema/property projection và flow tạo booking (`OTA-xxxx`) hiện hữu; server pricing, snapshot đầy đủ, authorization và state-machine hardening còn trong roadmap.
- **Frontend & Design System**: Next.js 16 + Tailwind CSS 4, Aurum Haven Design Tokens (Quiet Luxury), `@dangminhdev04032005/query-resource` 4-layer architecture.
- **Service Boundary**: Boundary OTA vs PMS rõ ràng, adapter contract VietSageSyncModule.

---

## 2. Forward Priorities

### Priority 0 — Security & Structural Hardening
- [ ] Đóng booking PII/auth scope và bảo vệ sync/reconciliation endpoint.
- [ ] Loại direct `page.tsx → backendFetch`; đưa workflow vào feature client/resource/hook hoặc BFF phù hợp.
- [ ] Server-side date/pricing validation; không nhận total có thẩm quyền từ browser.
- [ ] Giữ Graphify current; dùng graph impact + scoped Repomix trước refactor module.

### Priority 1 — VietSage Live Sync & Two-Way Connector
- [ ] Triển khai kết nối thực tế hai chiều giữa `booking-manager` và `fullstack-vietSage` qua versioned HTTP API / Webhook.
- [ ] Đồng bộ Allotment & Real-time Availability (PMS nắm quyền sở hữu tồn kho thực tế, OTA query hold/lock).
- [ ] Xử lý timeout-after-write, durable idempotency key và cơ chế compensation / reconciliation định kỳ.

### Priority 2 — Payment Gateway & Webhook Orchestration
- [ ] Tích hợp cổng thanh toán (VNPay / VietQR / Stripe) cho OTA Checkout.
- [ ] Webhook handler xác thực signature, chống replay, idempotent transaction snapshot.
- [ ] State machine thanh toán: Pending → Authorized → Captured → Refunded / Expired.

### Priority 3 — Multi-property Partner Portal & Operations
- [ ] Giao diện quản lý Allotment, Rate Calendar cho Hotel Partner.
- [ ] Báo cáo doanh thu OTA, commission tracking và xuất đối soát (Settlement report).
- [ ] Quản lý Cancellation Policy & Refund SLA tự động theo chính sách phòng.

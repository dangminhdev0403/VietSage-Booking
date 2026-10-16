# Architecture Documentation Index

Bộ tài liệu có thẩm quyền cho `booking-manager` — OTA tích hợp với VietSage qua service boundary.

## Core documents

1. [`ARCHITECTURE.md`](ARCHITECTURE.md) — topology, quyền sở hữu OTA/PMS, data authority và điều kiện service extraction.
2. [`RULES.md`](RULES.md) — guardrails bắt buộc về code, security, booking, contract và integration.
3. [`MODULE_MAP.md`](MODULE_MAP.md) — bounded contexts, model ownership, capability ports và legacy compatibility.
4. [`FRONTEND_GUIDE.md`](FRONTEND_GUIDE.md) — Next.js App Router và server-state conventions.
5. [`BACKEND_GUIDE.md`](BACKEND_GUIDE.md) — NestJS boundaries, booking protocol, snapshot, reliability và verification.
6. [`CONTRACT_GUIDE.md`](CONTRACT_GUIDE.md) — OTA OpenAPI, VietSage provider contract, versioning và rollout compatibility.
7. [`INTEGRATION_GUIDE.md`](INTEGRATION_GUIDE.md) — quote/hold/confirm/cancel, mapping, webhook, retry/reconciliation và service readiness.
8. [`GRAPHIFY_GUIDE.md`](GRAPHIFY_GUIDE.md) — cài đặt Graphify, graph-first navigation, scoped Repomix và freshness rules.
9. [`PLANS.md`](PLANS.md) — Forward engineering roadmap cho OTA Platform; không ghi nhật ký hoàn tất vi mô.

## Routing

- Thay đổi ownership/topology: đọc `ARCHITECTURE.md` + `MODULE_MAP.md`.
- Booking/backend: thêm `BACKEND_GUIDE.md`.
- API contract: thêm `CONTRACT_GUIDE.md`.
- VietSage sync/service extraction: bắt buộc đọc `INTEGRATION_GUIDE.md`.
- Rà soát kiến trúc, impact analysis hoặc code chưa quen: đọc `GRAPHIFY_GUIDE.md`, query graph trước khi search file.

OpenAPI và executable checks quyết định trạng thái implementation. Tài liệu không biến endpoint `planned`/stub thành production-ready.

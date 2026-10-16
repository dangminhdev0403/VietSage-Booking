# Quy tắc booking-manager

## 1. Documentation & Execution Flow

- Tài liệu kiến trúc có thẩm quyền nằm trong `Architecture/`.
- `ARCHITECTURE.md` định nghĩa topology/ownership; `MODULE_MAP.md` định nghĩa bounded context; `INTEGRATION_GUIDE.md` định nghĩa boundary VietSage.
- OpenAPI, code và executable checks là bằng chứng implementation; Markdown không được tuyên bố tính năng production-ready trái với runtime.
- **Zero-Overhead Execution Flow**: Khi phát lệnh triển khai (plan đã được tạo/thống nhất trước đó):
  - Agent lập tức thực thi code, chạy test/validation nhỏ nhất, không lặp lại bất kỳ thao tác ghi lại plan, cập nhật phase hay mở file đánh dấu hoàn tất (`[x]`, `[COMPLETED]`, `status: success`).
  - Báo cáo cuối cùng (Final Report) và Git commit/diff là bằng chứng hoàn tất duy nhất. Tuyệt đối không biến tài liệu hay repository thành nhật ký hoàn tất vi mô (completion diary / plan graveyard).
  - `Architecture/PLANS.md` chỉ là Forward Engineering Roadmap cho các mục tiêu kiến trúc tương lai; cấm append checklist các micro-task đã xong.
  - File plan tạm trong `.hermes/plans/` (nếu có dùng cho task phức tạp) chỉ lưu ngữ cảnh cho task đang dở dang (`processing` / `blocked`). Khi task hoàn thành và nghiệm thu qua Final Report, dọn dẹp (xóa) file plan tạm này; không ghi đè đánh dấu hoàn tất.

## 2. Repository và dependency

- Không ghi secret, token, password, API key hoặc connection string vào docs/code/log.
- Thay đổi dependency/lockfile cần phê duyệt riêng.
- Frontend không import backend source; backend không phụ thuộc frontend.
- `booking-manager` và `fullstack-vietSage` không import source, Prisma, migration hoặc truy cập chung database.
- Timezone canonical của platform là `Asia/Ho_Chi_Minh`; timestamp liên hệ thống truyền ISO-8601 UTC, business date dùng hotel timezone từ authority.

## 3. Code navigation

- Khi `graphify-out/graph.json` tồn tại, architecture/debugging/impact task phải query Graphify theo symbol trước khi search filesystem rộng.
- Workflow: `explain|affected|path` → minimal file set → scoped Repomix → exact source ranges → edit/test.
- Source hiện tại, OpenAPI, schema, tests và runtime luôn thắng graph/docs nếu có khác biệt.
- Filesystem search chỉ là fallback khi graph missing/stale/không biểu diễn target; phải nêu gap và giới hạn path.
- `graphify-out/` là local generated context, không commit. Refresh sau module/feature đổi dependency; không refresh cho copy/CSS-only.

## 4. Backend và ownership

- NestJS modular monolith; mỗi bounded context sở hữu table và business rules của mình.
- Controller mỏng; application service sở hữu workflow/authorization/transaction; repository là private implementation.
- Cross-context dùng public service/port và opaque IDs.
- VietSage sở hữu PMS inventory/rate/restriction, physical room, reservation/stay, room assignment và check-in/out.
- booking-manager sở hữu OTA booking/order, snapshot thương mại, payment orchestration và customer journey.
- Projection local không cấp quyền ghi ngược và không được dùng để confirm sellability.

## 5. Booking, date và money

- Khoảng lưu trú là `[check_in, check_out)`; reject `check_out <= check_in`.
- Server tính total; không tin giá/payment status từ browser.
- Tiền dùng integer minor unit hoặc Decimal chính xác kèm currency.
- Lưu price/tax/fee/discount/cancellation snapshot tại thời điểm đặt.
- Booking/payment/PMS reservation là state machine riêng.
- Confirm booking cần provider hold/reservation confirmation; timeout mutation là unknown outcome cần query/reconcile.

## 6. DTO, auth và privacy

- Tách controller DTO, internal command/query và response DTO; validate trust boundary bằng Zod.
- Không dùng `Record<string, any>`/untyped `any` tại HTTP hoặc provider boundary.
- External JSON dùng `snake_case`; TypeScript/Prisma nội bộ dùng `camelCase`.
- Mọi mutation kiểm tra actor, permission và resource/hotel scope ở backend.
- Booking list/detail/status chứa PII không public; traveler chỉ đọc booking của mình, partner chỉ trong scope được cấp.
- Log/audit phải redact secret, token, signature, guest PII và payment data không cần thiết.

## 7. VietSage integration

- Mọi giao tiếp đi qua `VietSageSyncModule` ACL và provider contract versioned.
- Mutation có idempotency key/correlation bền vững; retry dùng lại cùng key.
- Không giữ DB transaction mở qua network; dùng compensation + reconciliation, không distributed transaction.
- Webhook verify signature, timestamp/replay, event ID; xử lý duplicate/out-of-order an toàn.
- Không ghi sync `SUCCESS`, trả fake ID hoặc fake provider response khi chưa gọi provider thật.
- Endpoint sync/reconciliation là protected internal/admin endpoint, không `@Public()`.

## 8. Frontend

- Ưu tiên Server Components; Client Components chỉ cho interaction/browser API.
- Server state: `Feature API Client → Resource (@dangminhdev04032005/query-resource) → Feature Hook → Component`.
- Không raw `fetch`/`useQuery`/`useMutation` trong presentation component hoặc feature hook.
- Shared/persistent client state dùng Zustand safe storage; không gọi `localStorage`/`sessionStorage` trực tiếp trong component.
- Route `app/**/page.tsx` là composition shell mỏng; UI copy sạch, hospitality-grade.

## 9. Contract

- `shared/api-contract/openapi/v1/openapi.json` là contract public của booking-manager.
- `openapi.yaml`, root `share_api.json` và frontend mirror phải đồng bộ.
- Provider contract của VietSage do VietSage export; booking-manager chỉ consume version đã pin/kiểm thử.
- Mọi operation có status `implemented` hoặc `planned`; simulated/stub provider behavior không được đánh dấu `implemented`.
- Verify bằng `node shared/api-contract/scripts/verify-contract.cjs`.

## 10. Quality gates

| Scope | Minimum gate |
| --- | --- |
| API contract | Contract parity + JSON/YAML parse. |
| Backend/DTO | Unit/validation tests, lint, TypeScript build, Prisma validate. |
| Auth/PII | Positive/negative authorization và scope tests. |
| Booking/payment | Date, money, snapshot, state transition, idempotency tests. |
| VietSage integration | Contract/mapper tests; duplicate, timeout-after-write, compensation, reconciliation, webhook verification. |
| Frontend | Feature client tests, lint, TypeScript build. |

Migration/apply, dependency, provider write, deploy/cutover và commit/push là protected steps cần phê duyệt riêng.

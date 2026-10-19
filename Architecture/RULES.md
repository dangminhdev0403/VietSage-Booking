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
- Route `app/**/page.tsx` là composition shell mỏng.
- Tuân thủ nghiêm ngặt chuẩn Typography, Anti-Widow/Orphan & UI Pruning tại `FRONTEND_GUIDE.md`:
  - Sàn font tối thiểu: Cấm font size < 12px (`text-xs`). Tuyệt đối cấm micro-font tuỳ tiện (`text-[10px]`, `text-[11px]`).
  - Cân bằng dòng chữ (Anti-Widow/Orphan): Cấm gãy dòng cộc lốc/rớt từ đơn lẻ (`text-balance` cho tiêu đề, `text-pretty` cho đoạn văn, `whitespace-nowrap` cho badge/pill).
  - Cấu trúc tiêu đề (Anti-Stacking): Cấm chồng 3 tầng lặp ý (Eyebrow, Title, Subtitle cùng nói một nội dung). Form đơn lẻ giới hạn `max-w-md` đến `max-w-lg`.
  - Cấm văn bản sáo rỗng, hoa mỹ, hoặc mô tả một dòng thừa thãi dưới tiêu đề rõ nghĩa.
  - Cấm lạm dụng card lồng card (nested cards), banner trang trí chiếm diện tích không có giá trị thông tin, và các nút thao tác trùng lặp.
  - **In-Place Tab Isolation & Zero-Disruptive Redirect**:
    - 1 tab = 1 autonomous workspace.
    - STRICTLY FORBIDDEN: Action buttons (edit, save, cancel) triggering cross-tab/cross-page redirects (e.g. room edit redirecting to inventory list).
    - All edits/details must execute in-place (Slide-over Drawer, Modal, Inline edit, Split-view). Preserve scroll, filters, and tab state upon save/cancel with in-place refetch/optimistic update.

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
| Frontend | Feature client tests, lint, TypeScript build, UI design gate (`node scripts/verify-ui-rules.cjs`). |

- **Zero-Waste Validation Protocol (Quy Tắc Miễn Trừ Lệnh Thừa & Tối Ưu Tốc Độ)**:
  - Khi chỉnh sửa UI, CSS, Tailwind classes, spacing, layout JSX, copywriting, hoặc thêm component hiển thị:
    - **CẤM CHẠY**: Test suites (`test`, `jest`, `vitest`, `playwright`), full-repo lint (`eslint .`, `pnpm lint`), full Next build (`next build`).
    - **Chỉ chạy**: `node scripts/verify-ui-rules.cjs`. Chỉ chạy thêm scoped `tsc --noEmit` nếu có imports/props/types mới.
  - **Lệnh thừa khác cấm chạy tự tiện**: Cấm chạy `verify-contract` khi không đổi contract; cấm chạy Prisma/DB commands cho frontend; cấm chạy `graphify update` cho các sửa đổi UI/CSS/copy nhỏ; cấm format diện rộng (`prettier --write .`); cấm chạy Docker rebuild; cấm chạy test chéo repository không liên quan.

### Ma trận kiểm thử tối thiểu (Zero-Waste Matrix)

| Phạm vi công việc (Scope) | Lệnh CẦN CHẠY duy nhất | Lệnh TUYỆT ĐỐI CẤM CHẠY (Thừa thãi) |
| :--- | :--- | :--- |
| **Chỉnh UI, CSS, Component, Copy** | `node scripts/verify-ui-rules.cjs`<br>(+ scoped `tsc --noEmit` nếu có import/type mới) | CẤM: `test`, `vitest`, `jest`, `playwright`, `eslint .`, `next lint`, `next build`, `verify-contract`, `prisma`, `graphify update`. |
| **Sửa DTO / Backend Service logic** | Scoped unit test cho service đó (`jest path/to/service.spec.ts`) + scoped `tsc` | CẤM: test toàn repo, E2E browser tests, next build, frontend lint. |
| **Sửa API Contract / Endpoints** | `node shared/api-contract/scripts/verify-contract.cjs` | CẤM: full frontend test, UI visual checks, DB seed. |
| **Sửa Database Schema / Migration** | `npx prisma validate` | CẤM: `db:reset`, seed production, frontend test suite. |
| **Sửa Docs / Markdown / Quy tắc** | Đọc lại Git diff | CẤM: Mọi lệnh test, lint, build, tsc. |

- **Audit Mode**: Silent Execution mandatory. When auditing UI, strictly enforce Typography Floor >= 12px, Zero-Fluff Copy, Ruthless Pruning, In-Place Tab Isolation (zero disruptive redirects), verified via `node scripts/verify-ui-rules.cjs`.
Migration/apply, dependency, provider write, deploy/cutover và commit/push là protected steps cần phê duyệt riêng.

## 11. Cấu hình Docker & Deployment

Chi tiết hướng dẫn: [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md).

- **Ranh giới độc lập hạ tầng**: `booking-manager` giữ stack runtime, database và role riêng. Giai đoạn dùng chung VPS được dùng chung một PostgreSQL instance VietSage, nhưng tuyệt đối không dùng chung database/schema/role; không mount trực tiếp volume PostgreSQL.
- **Ingress duy nhất**: Mọi traffic vào hệ thống phải qua Nginx unprivileged (`nginxinc/nginx-unprivileged:1.28-alpine`). Host mapping qua loopback `127.0.0.1:${BOOKING_NGINX_HTTP_PORT:-28080}:8080`. Frontend, Backend và PostgreSQL không publish cổng công khai trên production.
- **Cô lập mạng nội bộ**: `edge` chỉ nối Nginx/frontend/backend. Backend nối external network VietSage `backend` để truy cập PostgreSQL và auth-service nội bộ; frontend/backend có network egress riêng. Database Booking dùng `booking_db` và `booking_user` quyền tối thiểu.
- **Chuẩn Hardening Container bắt buộc**:
  - Chạy bằng non-root user (`USER node`).
  - Read-only root filesystem (`read_only: true`).
  - Writable storage chỉ cấp qua `tmpfs` giới hạn (`/tmp`, `/app/.next/cache`, `/var/cache/nginx`).
  - Không cho phép leo thang đặc quyền (`no-new-privileges:true`), thu hồi mọi capability (`cap_drop: [ALL]`).
  - Giới hạn tài nguyên chặt chẽ: `mem_limit`, `cpus`, `pids_limit` trên từng service.
  - Log rotation: Driver `json-file`, `max-size: "10m"`, `max-file: "5"`.
- **Quản lý Secrets & Biến môi trường**:
  - Tuyệt đối cấm commit file `.env`, credentials, secret keys vào Git.
  - Phân vùng secret theo môi trường: `secrets/docker/*.env` (local) và `secrets/production/*.env` (VPS), luôn được ignore.
  - Next.js build-time secret: Dùng ephemeral secret hoặc BuildKit secret mount (`--mount=type=secret,id=frontend_build_auth`), cấm nung secret thật vào image build.
  - Tiền tố `NEXT_PUBLIC_*`: Chỉ dùng cho public client configuration. Mọi secret, backend internal URL, payment private key, sync token phải là server-only.
- **Cổng di chuyển CSDL (Migration Gate) & Khởi động**:
  - Trình tự phát hành bất biến: PostgreSQL dùng chung healthy -> one-shot `migrate` (`prisma migrate deploy`) -> start `backend`/`frontend`/`nginx`.
  - Không chạy demo seed trên production. Chỉ thêm one-shot production bootstrap riêng khi có dữ liệu hệ thống bắt buộc chưa nằm trong migration.
  - Service `backend` bắt buộc phụ thuộc `migrate` với `condition: service_completed_successfully`.
  - CẤM TUYỆT ĐỐI trên production: `prisma migrate dev`, `prisma db push`, `prisma migrate reset`. Lỗi migration phải fail rollout ngay lập tức.
- **Giám sát sức khỏe 2 tầng (Two-Tier Healthcheck)**:
  - Liveness probe: `/health` hoặc `/api/health` (process alive, phản hồi ngay).
  - Readiness probe: `/health/ready` (kiểm tra kết nối PostgreSQL thực tế, bounded timeout 3s).
  - Container healthchecks phải cấu hình đầy đủ `interval`, `timeout`, `start-period`, `retries`.
- **Database Connection Pool & Deadlines**:
  - Mỗi backend instance giới hạn `DATABASE_POOL_MAX` = 10 kết nối; tổng pool luôn nhỏ hơn `max_connections` của PostgreSQL.
  - Giới hạn timeout: connection timeout (2s), query/statement timeout (8-9s), transaction timeout (10s), HTTP keep-alive timeout (5s).
- **Sao lưu & Khắc phục thảm họa (Disaster Recovery)**:
  - Backup định kỳ PostgreSQL với custom format (`pg_dump -Fc`), kèm SHA-256 checksum và quyền `umask 077`.
  - Diễn tập khôi phục (Restore rehearsal) BẮT BUỘC thực hiện trên tên database mới độc lập; TUYỆT ĐỐI CẤM restore đè database production live.
  - Schema migration phải luôn tương thích ngược; rollback image container không thể đảo ngược thay đổi schema phá vỡ (breaking schema).

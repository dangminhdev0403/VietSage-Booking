# Agent Instructions for booking-manager (OTA Platform)

These instructions are mandatory for Codex and any delegated coding agent working in this repository.

## Required Reading Before Changes

Before editing, creating, deleting, moving, or refactoring files, read:

1. `Architecture/README.md`
2. `Architecture/ARCHITECTURE.md`
3. `Architecture/RULES.md`
4. The task-specific guide:
   - architecture discovery, impact analysis, unfamiliar code: `Architecture/GRAPHIFY_GUIDE.md`
   - frontend/UI work: `Architecture/FRONTEND_GUIDE.md`
   - backend/domain work: `Architecture/MODULE_MAP.md` and `Architecture/BACKEND_GUIDE.md`
   - API contract work: `Architecture/CONTRACT_GUIDE.md`
   - VietSage integration/service-boundary work: `Architecture/MODULE_MAP.md`, `Architecture/CONTRACT_GUIDE.md`, and `Architecture/INTEGRATION_GUIDE.md`
   - complex-task planning/progress: the selected English `.hermes/plans/<timestamp>-<slug>.md`; `Architecture/PLANS.md` is historical milestone context only

Do not load every markdown file by default. Load only the architecture entry point and the guide matching the task.

## Graphify-First Navigation

- For architecture review, debugging, impact analysis, or an unfamiliar flow, use the local graph before broad filesystem search: `env -u PYTHONPATH graphify explain|affected|path`.
- Extract 1–2 symbol anchors; use `query` only when anchors are unknown or broad traversal is required.
- Convert graph output into the smallest file set, pack only that set with Repomix, then inspect exact current source.
- Direct filesystem search is fallback-only when the graph is absent, stale, or cannot represent the target; state that gap first.
- Source, OpenAPI, schema, tests, and runtime remain authoritative. Refresh with `env -u PYTHONPATH graphify update .` after a verified module/feature changes dependencies.
- Full workflow: `Architecture/GRAPHIFY_GUIDE.md`.

## Project Direction & Ecosystem Position

- Current mode: Standalone product workspace for **OTA Booking Platform** (Online Travel Agency).
- Ecosystem role: Integrates with **VietSage** (`C:\Users\Dangminhdev0403\Desktop\workspace\fullstack-vietSage`) through a versioned provider contract and `VietSageSyncModule` ACL.
- VietSage owns PMS inventory/rates/restrictions, physical rooms, reservations/stays, room assignment, and check-in/out. `booking-manager` owns OTA commerce, booking intent/order, payment orchestration, customer self-service, and local projections.
- Keep databases, migrations, source code, and persistence private to each repository. The boundary must remain valid if VietSage is extracted into a separate service.

## Mandatory Tech Stack Guardrails (Step-Zero Reuse)

- **Persistent / Shared Client State**: MUST use **Zustand** (`persist` + `createJSONStorage` + safe storage). Strictly FORBIDDEN to call `localStorage` / `sessionStorage` directly in components, hooks, or pages.
- **Server State / API Calls**: MUST use **`@dangminhdev04032005/query-resource`** (`repository` → `resource` → `feature hook` → `component`). FORBIDDEN to write raw `useQuery`, raw `fetch`, or raw `axios` inside components.
- **Backend Validation**: MUST use **Zod** schemas + explicit validation. FORBIDDEN to use untyped `any` or bypass DTO validation.
- **Timezone Standard**: MUST use canonical **`Asia/Ho_Chi_Minh`** (UTC+7).
- **UI Design, Typography & Anti-Fluff Standard**: Minimum font size is strictly 12px (`text-xs`). Strictly FORBIDDEN arbitrary micro-classes (`text-[10px]`, `text-[11px]`, etc.). Strictly FORBIDDEN boilerplate marketing fluff slogans, redundant one-line descriptions under clear headings, decorative nested cards, and developer placeholders. Follow `Architecture/FRONTEND_GUIDE.md#4`.
- **Envelopes**: All API responses must follow `{ success: true, data: ..., meta: ... }` and `{ success: false, error: { code, message, details }, request_id }`.
- **Contract Parity**: `shared/api-contract/openapi/v1/openapi.json` is authoritative. Mirrors in `openapi.yaml`, `share_api.json`, and `frontend-booking/config/share_api.json` must be strictly synchronized.

## Enforceable Coding Rules

- Do not create architecture docs outside `Architecture/`.
- Do not modify `package.json` or add dependencies without explicit user approval.
- Frontend must not import backend source files directly; backend must not depend on frontend code.
- External API contracts use `snake_case`; internal TypeScript/Prisma models use `camelCase`.
- Admin operations must call Next BFF `/api/admin/...`, never direct backend `/api/v1/...`.
- Frontend code changes must pass the UI Design Gate: `node scripts/verify-ui-rules.cjs`.
- **Chế độ rà soát (Audit / Review Mode)**:
  - Khi nhận yêu cầu rà soát/audit/soát code: Thực thi ngầm (Silent Execution), cấm spam lời thoại/tiến trình trung gian trong lúc gọi tool, chỉ trả lời duy nhất một Báo cáo Cuối cùng hoàn chỉnh ở đầu ra.
  - Bắt buộc kiểm tra **UI Design & Typography Gate** cho mọi thành phần giao diện được rà soát:
    - Sàn kích thước font: CẤM font < 12px (`text-[10px]`, `text-[11px]`, sub-0.75rem).
    - Nội dung: CẤM văn bản sáo rỗng, hoa mỹ rập khuôn, hoặc mô tả thừa thãi dưới tiêu đề; CẤM developer placeholders.
    - Cấu trúc UI: CẤM hội chứng card lồng card, banner khổng lồ vô nghĩa, cụm nút trùng lặp, blur tràn lan.
    - Bắt buộc chạy và báo cáo kết quả `node scripts/verify-ui-rules.cjs`.
- **Zero-Waste Validation & Command Exemption (Miễn trừ lệnh thừa & Tối ưu tốc độ)**:
  - Khi chỉnh sửa UI, CSS, Tailwind classes, spacing, layout JSX, copywriting, hoặc thêm component hiển thị thuần túy (pure presentation component):
    - **CẤM CHẠY**: Test suites (`npm test`, `pnpm test`, `jest`, `vitest`, `playwright`, contract tests), full-repo lint (`pnpm lint`, `eslint .`), và build bundling (`next build`).
    - **Lệnh duy nhất được chạy**: `node scripts/verify-ui-rules.cjs` (quét tĩnh < 1s). Chỉ chạy thêm `tsc --noEmit` nếu có imports/props/types mới để chống lỗi cú pháp.
  - **Các lệnh thừa khác cấm chạy tự tiện**:
    - Cấm chạy `verify-contract` khi task không đổi OpenAPI / DTO contract.
    - Cấm chạy Prisma / DB commands (`prisma validate`, `db push`, `seed`) cho các task frontend.
    - Cấm chạy `graphify update` cho các sửa đổi CSS/copy/UI nhỏ.
    - Cấm format diện rộng toàn bộ dự án (`prettier --write .`).
    - Cấm chạy Docker build / rebuild container khi phát triển hoặc kiểm thử cục bộ.
    - Cấm chạy kiểm thử chéo repository không liên quan (chỉ kiểm tra đúng phạm vi touched area).
- **Zero-Overhead Execution**: Khi nhận lệnh triển khai (plan đã thống nhất/tạo trước): Chuyển thẳng sang thực thi code và kiểm thử, cấm lặp lại flow ghi lại plan hoặc mở file sửa trạng thái đánh hoàn tất (`[x]`, `[COMPLETED]`, `status: success`). Báo cáo cuối cùng và Git diff là bằng chứng hoàn tất duy nhất; dọn dẹp file plan tạm sau khi xong task.
- `Architecture/PLANS.md` chỉ là Forward Engineering Roadmap cho các mục tiêu kiến trúc tương lai; không append nhật ký checklist micro-task đã xong.

## Before Final Report

Report:
- docs read (exact paths);
- files inspected;
- files changed;
- validation commands run and real results;
- docs updated;
- remaining risks/blockers.

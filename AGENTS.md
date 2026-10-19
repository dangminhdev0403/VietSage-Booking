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
- **UI Design, Typography, Anti-Fluff & Balance Standard**: Minimum font size is strictly 12px (`text-xs`). Strictly FORBIDDEN arbitrary micro-classes (`text-[10px]`, `text-[11px]`, etc.). Strictly FORBIDDEN boilerplate marketing fluff slogans, redundant one-line descriptions under clear headings, decorative nested cards, and developer placeholders. Headings MUST use `text-balance` to prevent dangling orphan words ("gãy dòng cộc lốc"). Multi-line copy MUST use `text-pretty`. Badges/pills MUST use `whitespace-nowrap`. Strictly FORBIDDEN triple-layer redundant stacking (Eyebrow + Heading + Subtitle saying the same thing). Single-column forms/cards capped at `max-w-md` to `max-w-lg`. Follow `Architecture/FRONTEND_GUIDE.md#4`.
- **In-Place Tab Processing & Zero-Disruptive Redirect Standard**: Each tab is an autonomous workspace ("1 Tab = 1 Autonomous Workspace"). STRICTLY FORBIDDEN: Buttons or actions triggering cross-tab/cross-page redirects during in-tab workflows (e.g. editing a room redirecting back to inventory list). All edit/detail actions MUST execute in-place (Drawer/Sheet, Modal, Inline, Split-view). Sub-states sync solely via shallow URL query params (`replaceState`). Follow `Architecture/FRONTEND_GUIDE.md#4.6`.
- **Envelopes**: All API responses must follow `{ success: true, data: ..., meta: ... }` and `{ success: false, error: { code, message, details }, request_id }`.
- **Contract Parity**: `shared/api-contract/openapi/v1/openapi.json` is authoritative. Mirrors in `openapi.yaml`, `share_api.json`, and `frontend-booking/config/share_api.json` must be strictly synchronized.

## Enforceable Coding Rules

- Do not create architecture docs outside `Architecture/`.
- Do not modify `package.json` or add dependencies without explicit user approval.
- Frontend must not import backend source files directly; backend must not depend on frontend code.
- External API contracts use `snake_case`; internal TypeScript/Prisma models use `camelCase`.
- Admin operations must call Next BFF `/api/admin/...`, never direct backend `/api/v1/...`.
- Frontend code changes must pass the UI Design Gate: `node scripts/verify-ui-rules.cjs`.
- **Audit / Review Mode**:
  - Silent Execution is mandatory: emit zero play-by-play narrative during tool calls. Emit a single comprehensive final report at completion.
  - Mandatory **UI Design & Typography Gate**:
    - Minimum font size: strictly >= 12px (`text-xs`). Ban micro-classes (`text-[10px]`, `text-[11px]`, sub-0.75rem).
    - Typographic balance: Ban dangling orphan words (`text-balance` for headings, `text-pretty` for copy, `whitespace-nowrap` for pills).
    - Anti-Stacking: Ban 3-layer redundant headers (Eyebrow, Title, Subtitle repeating the same message). Single-column forms capped at `max-w-md` to `max-w-lg`.
    - Zero fluff: Ban marketing slogans, boilerplate sub-descriptions, and developer placeholders.
    - Clean structure: Ban nested cards, meaningless huge banners, duplicate buttons, and excessive blur.
    - In-Place Tab Isolation: Ban action buttons triggering cross-tab redirects (e.g. room edit redirecting to inventory list). Actions must stay in-place (Drawer, Modal, Inline, Split-view).
    - Verification: Must run and pass `node scripts/verify-ui-rules.cjs`.
- **Zero-Waste Validation & Command Exemption**:
  - For UI, CSS, Tailwind, spacing, layout JSX, copywriting, or pure presentation components:
    - FORBIDDEN: Full test suites (`npm test`, `jest`, `vitest`, `playwright`), full-repo lint (`pnpm lint`, `eslint .`), and build bundling (`next build`).
    - ONLY RUN: `node scripts/verify-ui-rules.cjs` (< 1s static scan). Add `tsc --noEmit` only when new imports/props/types are introduced.
  - Redundant commands strictly forbidden:
    - Never run `verify-contract` when OpenAPI/DTO contract did not change.
    - Never run Prisma / DB commands (`prisma validate`, `db push`, `seed`) for frontend tasks.
    - Never run `graphify update` for CSS/copy/UI micro-edits.
    - Never run repo-wide formatting (`prettier --write .`).
    - Never rebuild Docker containers for local development.
- **Zero-Overhead Execution**: Once a plan is agreed, immediately execute code and verification. Never update micro-checkboxes (`[x]`, `[COMPLETED]`) in markdown files. Final report and Git diff are the sole proof of completion. Clean up temporary plan files upon task closure.
- `Architecture/PLANS.md` is a forward roadmap only; never append completion diaries.

## Before Final Report

Report:
- docs read (exact paths);
- files inspected;
- files changed;
- validation commands run and real results;
- docs updated;
- remaining risks/blockers.

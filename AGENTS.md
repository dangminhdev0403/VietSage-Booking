# Agent Instructions for booking-manager (OTA Platform)

These instructions are mandatory for Codex and any delegated coding agent working in this repository.

## Required Reading Before Changes

Before editing, creating, deleting, moving, or refactoring files, read:

1. `Architecture/README.md`
2. `Architecture/ARCHITECTURE.md`
3. `Architecture/RULES.md`
4. The task-specific guide:
   - frontend/UI work: `Architecture/FRONTEND_GUIDE.md`
   - backend/API work: `Architecture/BACKEND_GUIDE.md`
   - API contract work: `Architecture/CONTRACT_GUIDE.md`
   - VietSage integration work: `Architecture/INTEGRATION_GUIDE.md`
   - planning/progress work: `Architecture/PLANS.md`

Do not load every markdown file by default. Load only the architecture entry point and the guide matching the task.

## Project Direction & Ecosystem Position

- Current mode: Standalone product workspace for **OTA Booking Platform** (Online Travel Agency).
- Ecosystem role: Directly integrates and synchronizes with **VietSage** (`C:\Users\Dangminhdev0403\Desktop\workspace\fullstack-vietSage`) for property inventory, room availability, dynamic rates, and booking synchronization.
- Keep the modular monolith simple, while keeping frontend, backend, and external VietSage integration boundaries explicit.

## Mandatory Tech Stack Guardrails (Step-Zero Reuse)

- **Persistent / Shared Client State**: MUST use **Zustand** (`persist` + `createJSONStorage` + safe storage). Strictly FORBIDDEN to call `localStorage` / `sessionStorage` directly in components, hooks, or pages.
- **Server State / API Calls**: MUST use **`@dangminhdev04032005/query-resource`** (`repository` → `resource` → `feature hook` → `component`). FORBIDDEN to write raw `useQuery`, raw `fetch`, or raw `axios` inside components.
- **Backend Validation**: MUST use **Zod** schemas + explicit validation. FORBIDDEN to use untyped `any` or bypass DTO validation.
- **Timezone Standard**: MUST use canonical **`Asia/Ho_Chi_Minh`** (UTC+7).
- **UI Copywriting & Clean UI Text Standard**: Professional hospitality phrasing, friendly and easy-to-use OTA interface, clean Vietnamese & English, zero developer placeholders.
- **Envelopes**: All API responses must follow `{ success: true, data: ..., meta: ... }` and `{ success: false, error: { code, message, details }, request_id }`.
- **Contract Parity**: `shared/api-contract/openapi/v1/openapi.json` is authoritative. Mirrors in `openapi.yaml`, `share_api.json`, and `frontend-booking/config/share_api.json` must be strictly synchronized.

## Enforceable Coding Rules

- Do not create architecture docs outside `Architecture/`.
- Do not modify `package.json` or add dependencies without explicit user approval.
- Frontend must not import backend source files directly; backend must not depend on frontend code.
- External API contracts use `snake_case`; internal TypeScript/Prisma models use `camelCase`.
- Admin operations must call Next BFF `/api/admin/...`, never direct backend `/api/v1/...`.
- When receiving audit/review requests: Execute silently (Silent Execution) and output only the final complete report.

## Before Final Report

Report:
- files inspected;
- files changed;
- validation commands run and real results;
- docs updated;
- remaining risks/blockers.

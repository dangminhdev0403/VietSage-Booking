# booking-manager Rules

## 1. Documentation Rules

- Architecture documentation lives strictly in `Architecture/`.
- `ARCHITECTURE.md` is the system architecture entry point.
- `MODULE_MAP.md` is the bounded context ownership reference.
- Do not scatter architecture or design notes in source folders.
- Routine validation evidence belongs in CI/test output, not in architecture docs.

## 2. Repository & Dependency Rules

- Do not put secrets, tokens, passwords, API keys, or connection strings in docs or code.
- Package script/config changes require explicit user approval (`AGENTS.md` Rule 5).
- Frontend must not import backend source files directly; backend must not depend on frontend code.
- Use canonical timezone `Asia/Ho_Chi_Minh` (UTC+7).

## 3. Backend Rules

- NestJS modular monolith: One bounded context per module.
- A bounded context owns its database tables and business logic.
- Controllers are thin: Handle HTTP parsing, DTO validation, and status mapping only.
- Application services own business workflows, state transitions, and authorization checks.
- Modules must not write directly to database tables owned by other modules via Prisma. Use exported services or explicit ports.
- Persistence entities are internal; always map to response DTOs at HTTP boundaries.

## 4. DTO & Validation Rules

- Separate controller DTO, internal command/query, and response DTO.
- No `Record<string, any>` or untyped `any` at HTTP/service boundaries.
- External API contracts use `snake_case`; internal models use `camelCase`.
- Every mutation must validate required fields, perform authorization, and provide standard error responses.

## 5. Frontend Rules

- Prefer Server Components by default; use Client Components for browser APIs, interactive states, forms, and client navigation.
- Mandatory Server State Pattern:
  `Feature API Client (fetch) → Resource (@dangminhdev04032005/query-resource) → Feature Hook → Component`.
- Strictly forbidden to write raw `useQuery`, `useMutation`, or raw `fetch` in presentation components or feature hooks directly.
- Shared / Persistent Client State: MUST use **Zustand** (`persist` + `createJSONStorage` + safe storage). Direct `localStorage` / `sessionStorage` calls in components are forbidden.
- Route files (`app/**/page.tsx`) must remain thin shells that compose feature components.
- UI copywriting must be professional, clean, hospitality-grade, without developer notes, test placeholders, or raw database codes.

## 6. Contract Rules

- `shared/api-contract/openapi/v1/openapi.json` is the authoritative source.
- `openapi.yaml`, `share_api.json`, and `frontend-booking/config/share_api.json` must be kept in sync.
- Every API endpoint requires an explicit implementation status: `implemented` or `planned`.
- Verify contracts with `node shared/api-contract/scripts/verify-contract.cjs`.

## 7. Quality Gates

| Change Scope | Minimum Gate |
| --- | --- |
| **API Contract** | Contract parity verification (`verify-contract.cjs`), JSON/YAML syntax check. |
| **Backend API / DTO** | Unit tests, DTO validation test, lint, TypeScript build, Prisma validate. |
| **Auth / RBAC** | Positive & negative authorization tests, session refresh tests, audit log assertions. |
| **Frontend Feature** | Feature client tests, lint, TypeScript build check. |
| **VietSage Integration** | Adapter mapping tests, status code translation, fallback/resilience assertions. |

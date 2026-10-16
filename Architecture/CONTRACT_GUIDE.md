# Contract Architecture Guide

## 1. Authoritative Contract Source

The authoritative API contract for the entire platform is:
```txt
shared/api-contract/openapi/v1/openapi.json
```

All other contract artifacts are strictly synchronized mirrors:
- `shared/api-contract/openapi/v1/openapi.yaml`
- `share_api.json` (Repository root mirror)
- `frontend-booking/config/share_api.json` (Frontend local mirror)

## 2. Parity & Verification

Before merging any API change or marking an endpoint implemented, run:
```bash
node shared/api-contract/scripts/verify-contract.cjs
```

The script verifies:
1. Parity between `openapi.json` and `openapi.yaml`.
2. Completeness of all path items and methods.
3. Existence of valid `x-implementation-status` (`implemented` or `planned`) on every operation.
4. Parity across root `share_api.json` and `frontend-booking/config/share_api.json`.

## 3. Global API Conventions

| Rule | Specification |
| --- | --- |
| **Prefix** | `/api/v1` |
| **JSON Case** | `snake_case` on HTTP wire; `camelCase` in internal TS/Prisma |
| **Dates** | ISO-8601 strings (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss.sssZ`) |
| **Money / Prices** | Integer amounts in minor units (e.g., VND whole integers or cents) |
| **Pagination Envelope** | `items`, `page`, `page_size`, `total`, `has_next` |
| **Success Envelope** | `{ "success": true, "data": ..., "meta": ... }` |
| **Error Envelope** | `{ "success": false, "error": { "code": ..., "message": ..., "details": ... }, "request_id": ... }` |

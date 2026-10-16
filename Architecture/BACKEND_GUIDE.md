# Backend Architecture Guide

## 1. Overview

`backend-booking` is a modular monolith built with **NestJS 11**, **Prisma ORM**, and **PostgreSQL**.

It is architected around bounded contexts representing OTA domains and exposes standard `/api/v1` HTTP endpoints conforming strictly to the OpenAPI contract.

## 2. Standard Module Structure

Every domain slice must follow the standard vertical slice pattern:

```txt
src/modules/[context]/
├── [context].module.ts
├── [context].controller.ts
├── [context].service.ts            # Application service / domain workflows
├── dto/                            # Request & response DTOs with Zod validation
├── persistence/                    # Optional repository or Prisma queries
└── [context].service.spec.ts       # Domain & workflow unit tests
```

## 3. Global Filters & Envelopes

All responses and errors are formatted by standard handlers:
- **GlobalExceptionFilter**: Intercepts all exceptions and produces the standard error envelope:
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Chi tiết lỗi dữ liệu",
      "details": []
    },
    "request_id": "req-xxx"
  }
  ```
- **ApiResponse Helpers**: Helper functions `ok(data, meta?)` and `fail(code, message, details?, requestId?)` to ensure response consistency.

## 4. Security & RBAC Standard

- **JWT Auth Strategy**: Bearer tokens with short-lived access tokens and database-backed refresh tokens (`RefreshSession`).
- **Decorators**:
  - `@Public()`: Marks endpoints accessible without authentication (e.g., public search, login, register).
  - `@CurrentUser()`: Injects authenticated user identity and active roles into the controller handler.
  - `@RequireRole(role)`: Enforces role-based permissions (`TRAVELER`, `HOTEL_PARTNER`, `ADMIN`, `SUPER_ADMIN`).
  - `@RequirePermission(permissionKey)`: Fine-grained permission enforcement.

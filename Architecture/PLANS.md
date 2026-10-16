# Project Plans & Milestones: booking-manager (OTA Platform)

## 1. Project Goal

Build a production-standard, scalable, user-friendly Online Travel Agency (OTA) booking system integrated with VietSage, adhering strictly to established architectural rules, OpenAPI contracts, and frontend server-state patterns.

## 2. Milestones

### Milestone 1: Architecture, Contracts & Monorepo Foundation [COMPLETED]
- [x] Establish root product workspace conventions, `AGENTS.md`, and `.gitignore`.
- [x] Author comprehensive architecture documentation in `Architecture/`.
- [x] Define authoritative OpenAPI v1 contract (`openapi.json` & `openapi.yaml`).
- [x] Create contract synchronization script `verify-contract.cjs` and verify contract parity.
- [x] Setup standard envelopes (`ApiSuccessEnvelope`, `ApiErrorEnvelope`).

### Milestone 2: Backend Core & Identity/Access [COMPLETED]
- [x] Configure Prisma ORM schema for PostgreSQL (Accounts, Roles, Permissions, Sessions, Audit).
- [x] Implement NestJS GlobalExceptionFilter, Response envelopes, and Logger middleware.
- [x] Implement JWT Strategy, Guards (`JwtAuthGuard`, `PermissionGuard`), and Decorators (`@CurrentUser`, `@Public`).
- [x] Seed database with Super Admin and standard OTA roles (`SUPER_ADMIN`, `ADMIN`, `HOTEL_PARTNER`, `TRAVELER`).

### Milestone 3: OTA Catalog & Booking Engine [COMPLETED]
- [x] Design OTA Schema: `Property`, `RoomType`, `AddonService`, `RoomAllotment`, `Booking`, `BookingItem`, `VietSageSyncLog`.
- [x] Implement `CatalogModule` with CRUD and public destination search endpoints.
- [x] Implement `BookingsModule` with booking creation, code generation (`OTA-xxxx`), and status management.
- [x] Implement `VietSageSyncModule` (ACL) with sync logs and VietSage outbound adapter.

### Milestone 4: Frontend Architecture & Server-State Integration [COMPLETED]
- [x] Configure Next.js 16 App Router, Tailwind CSS 4, and `@dangminhdev04032005/query-resource`.
- [x] Implement shared HTTP client (`lib/api/backend.ts`), Zod schemas (`lib/api/schemas.ts`), and QueryProvider.
- [x] Implement feature layers: `features/catalog/` and `features/bookings/` following the 4-layer standard.
- [x] Build modern, user-friendly OTA landing page, hotel search, and booking management UI.

### Milestone 5: End-to-End Validation & Contract Parity [COMPLETED]
- [x] Verify OpenAPI parity with `verify-contract.cjs`.
- [x] Validate backend compilation and TypeScript build.
- [x] Validate frontend compilation and linting.
- [x] Final architecture and deployment report.

### Milestone 6: Stitch Design System Inheritance (Aurum Haven) [COMPLETED]
- [x] Connect Google Stitch MCP and retrieve project `7411068166474105979` ("Hệ Thống Đặt Phòng Khách Sạn").
- [x] Inherit Design System tokens: "Aurum Haven" (Quiet Luxury / Warm Editorial Minimalism, Deep Bronze `#725b38`, Warm Champagne `#c5a880`, Warm Ivory `#faf9f6`, Playfair Display & Plus Jakarta Sans).
- [x] Replicate luxury editorial hero section and floating luxury booking bar.
- [x] Replicate prestige metrics bar and curated destinations bento grid.
- [x] Restyle PropertyCard and BookingModal with 16:10 aspect ratio, ratings, luxury badges, and instant reservation confirmation.
- [x] Restyle Partner Admin Dashboard with cohesive quiet luxury tokens.
- [x] Validate frontend build (`pnpm run build` exits 0 with all routes static-optimized).

### Milestone 7: Full-stack Authentication with Passport.js & Auth.js [COMPLETED]
- [x] Backend: Implement Passport.js `LocalStrategy` (`passport-local`) and `LocalAuthGuard` in NestJS `IdentityAccessModule`.
- [x] Backend: Integrate user validation into Passport lifecycle while retaining `JwtStrategy` and `JwtAuthenticationGuard`.
- [x] Frontend: Install and configure Auth.js (`next-auth@5.0.0-beta.32`) with Credentials Provider pointing to NestJS backend.
- [x] Frontend: Setup NextAuth Route Handler (`/api/auth/[...nextauth]`) and wrap application in `AuthSessionProvider`.
- [x] Frontend: Build `LoginModal` with React Portal, `/login` page, and `UserMenu` in public header with session dropdown, role badge, partner link, and sign-out action.
- [x] End-to-end Verification: Complete login, session storage, dropdown navigation, and sign-out verified via Chrome DevTools MCP.


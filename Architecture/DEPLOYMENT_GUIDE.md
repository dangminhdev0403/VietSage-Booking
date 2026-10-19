# Booking Manager — Production Build & Rollout Guide

## Topology tạm thời: dùng chung VPS VietSage

`booking-manager` giữ stack ứng dụng độc lập. Chỉ dùng chung PostgreSQL instance và Docker network backend trong giai đoạn đầu.

```text
Host Nginx/TLS
  booking.vietsage.com
          |
          v
  127.0.0.1:28080
          |
  booking-nginx:8080
       |         |
 frontend     backend
                 |
       fullstack-vietsage_backend
            |             |
 vietsage-postgres   vietsage-auth-service
      booking_db       direct-booking HMAC API
```

Ranh giới bắt buộc:

- Database riêng: `booking_db`.
- Role riêng: `booking_user`, không superuser, không `CREATEDB`, không `CREATEROLE`.
- Không dùng database/schema/role của VietSage.
- Không mount volume PostgreSQL vào Booking.
- Backend/PostgreSQL không publish host port.
- Ingress Booking chỉ bind loopback `127.0.0.1:28080`.
- Khi tách VPS: đổi `DATABASE_URL`, `VIETSAGE_API_BASE_URL`, external network; image ứng dụng không đổi.

## Artifacts

| Artifact | Mục đích |
|---|---|
| `backend-booking/Dockerfile` target `runtime` | Backend production, không chứa Prisma CLI |
| `backend-booking/Dockerfile` target `migration` | One-shot `prisma migrate deploy` |
| `frontend-booking/Dockerfile` | Next.js standalone production |
| `docker-compose.prod.yml` | Runtime tạm trên VPS VietSage |
| `scripts/bootstrap-shared-postgres.sh` | Candidate tạo database/role riêng; chỉ chạy sau phê duyệt |
| `secrets/production/*.env.example` | Hợp đồng biến môi trường; không chứa secret thật |

## Chuẩn bị secret — chưa chạy production

```bash
cp secrets/production/postgres.env.example secrets/production/postgres.env
cp secrets/production/backend.env.example secrets/production/backend.env
cp secrets/production/frontend.env.example secrets/production/frontend.env
chmod 600 secrets/production/*.env
```

Thay toàn bộ `replace_with_*`. Giá trị bắt buộc:

### `postgres.env`

- `BOOKING_DB=booking_db`
- `BOOKING_DB_USER=booking_user`
- `BOOKING_DB_PASSWORD`: tối thiểu 24 ký tự
- `VIETSAGE_POSTGRES_CONTAINER=vietsage-postgres`

### `backend.env`

- `DATABASE_URL`: trỏ `vietsage-postgres:5432/booking_db`
- `CORS_ORIGINS=https://booking.vietsage.com`
- `JWT_SECRET`: tối thiểu 32 ký tự
- `VIETSAGE_API_BASE_URL=http://vietsage-auth-service:8080`
- `VIETSAGE_HMAC_SECRET`: cùng giá trị với VietSage auth-service
- Stripe secret/webhook/return URL thật
- `STRIPE_SIMULATED=false`

Backend production fail startup nếu thiếu, dùng placeholder, secret ngắn hoặc bật simulated payment.

### `frontend.env`

- `AUTH_URL` và `NEXTAUTH_URL`: `https://booking.vietsage.com`
- `AUTH_SECRET` và `NEXTAUTH_SECRET`: cùng secret, tối thiểu 32 ký tự
- `INTERNAL_BACKEND_URL=http://backend:8081`

Frontend build dùng secret ngẫu nhiên tạm trong một build step. Runtime secret chỉ đến từ `frontend.env`.

## Build local

```bash
docker build --target runtime -t booking-backend:candidate ./backend-booking
docker build --target migration -t booking-backend-migrate:candidate ./backend-booking
docker build -t booking-frontend:candidate ./frontend-booking
```

Kiểm tra image:

```bash
docker run --rm --entrypoint sh booking-backend:candidate -c \
  'test ! -e node_modules/.bin/prisma && test -f dist/main.js && test -d prisma/migrations'

docker run --rm --entrypoint sh booking-backend-migrate:candidate -c \
  'test -x node_modules/.bin/prisma && test -d prisma/migrations'
```

## Migration gate

Production chỉ dùng:

```bash
docker compose -f docker-compose.prod.yml run --rm migrate
```

Cấm production:

- `prisma migrate dev`
- `prisma db push`
- `prisma migrate reset`
- `npm run db:seed`

`src/prisma/seed.ts` chứa dữ liệu demo. Không nằm trong production Compose. Lookup/role/permission bắt buộc đã nằm trong migration idempotent.

Trước rollout, chạy migration trên PostgreSQL sạch và bắt buộc đạt:

```bash
npx prisma migrate deploy
npx prisma migrate status
npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --exit-code
```

Kết quả hợp lệ: toàn bộ migration applied; `No difference detected`.

## Candidate tạo database/role dùng chung PostgreSQL

Đây là protected production step. Chỉ chạy sau backup + phê duyệt:

```bash
BOOKING_DB_ENV_FILE=secrets/production/postgres.env \
  ./scripts/bootstrap-shared-postgres.sh
```

Script idempotent; không tạo PostgreSQL container thứ hai; không sửa database VietSage.

## Compose

External network mặc định:

```text
fullstack-vietsage_backend
```

Nếu tên thực tế khác:

```bash
export VIETSAGE_BACKEND_NETWORK=<network-thực-tế>
```

Render candidate:

```bash
docker compose -f docker-compose.prod.yml config --quiet
```

Runtime budget:

| Service | RAM | CPU |
|---|---:|---:|
| backend | 512 MiB | 1.0 |
| frontend | 384 MiB | 0.75 |
| nginx | 128 MiB | 0.25 |
| migrate, one-shot | 512 MiB | 1.0 |

Không chạy build và migration đồng thời trên VPS 2 vCPU.

## Rollout candidate — chưa thực thi

1. Xác minh clean release SHA/image tag bất biến.
2. Backup riêng `vietsage_auth`, `booking_db` nếu tồn tại, globals/roles; kiểm tra checksum.
3. Tạo `booking_user`/`booking_db` bằng script đã duyệt.
4. Chạy one-shot migrate; dừng nếu exit khác 0.
5. Start `backend`, chờ `/health/ready`.
6. Start `frontend`, rồi `nginx`.
7. Host Nginx proxy `booking.vietsage.com` tới `127.0.0.1:28080`.
8. Cấp DNS/TLS.
9. Smoke auth, catalog, booking hold, Stripe webhook negative path, VietSage HMAC.
10. Theo dõi CPU/RAM/restart/OOM/log.

Không chạy demo seed.

## Rollback

- Gỡ/disable host Nginx vhost Booking.
- Stop Booking stack; không stop `vietsage-postgres`.
- Rollback image tag; không tự rollback schema.
- Không drop `booking_db` hoặc `booking_user` nếu chưa có xác nhận riêng.

## Tách VPS sau này

1. Dựng PostgreSQL riêng.
2. Backup/restore chỉ `booking_db` và role `booking_user`.
3. Đổi `DATABASE_URL`.
4. Đổi `VIETSAGE_API_BASE_URL` sang HTTPS/private tunnel được bảo vệ HMAC.
5. Bỏ external Docker network VietSage khỏi Compose.
6. Chạy migration/status/readiness/smoke; cutover DNS.

Không cần thay đổi schema hoặc source ứng dụng.

## Verification tối thiểu trước handoff

```bash
# Backend
npm run build
npx jest src/common/config/runtime-config.spec.ts \
  src/modules/vietsage-sync/vietsage-sync.spec.ts \
  src/modules/payments/payments.service.spec.ts --runInBand

# Frontend
pnpm build
pnpm audit --prod --audit-level high

# Docker/Compose
bash -n scripts/bootstrap-shared-postgres.sh
docker compose -f docker-compose.prod.yml config --quiet
```

Backend runtime image phải được audit riêng sau `npm prune --omit=dev`; Prisma CLI chỉ nằm trong migration image.

**Trạng thái tài liệu:** build/runbook local. Chưa deploy, chưa tạo database/role, chưa apply migration lên VPS.

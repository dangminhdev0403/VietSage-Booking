# Hướng dẫn kiến trúc backend

## 1. Baseline

`backend-booking` là NestJS 11 modular monolith dùng Prisma/PostgreSQL. Backend sở hữu domain OTA; VietSage PMS được truy cập qua integration port trong `VietSageSyncModule`.

Mọi HTTP endpoint public của OTA dùng `/api/v1` và tuân theo OpenAPI. Contract provider VietSage là contract riêng; không sao chép provider DTO vào controller/domain OTA.

## 2. Cấu trúc module

Source hiện tại dùng vertical slice phẳng. Đây là baseline hợp lệ cho module nhỏ:

```txt
src/modules/[context]/
├── [context].module.ts
├── [context].controller.ts
├── [context].service.ts       # application workflow
├── dto/                       # request/response DTO + Zod validation
├── persistence/               # repository/Prisma nội bộ nếu cần
└── [context].service.spec.ts  # focused behavior checks
```

Khi một module có nhiều workflow/persistence adapter và service phẳng làm mất locality, tiến hóa **trong chính context đó**:

```txt
src/modules/[context]/
├── api/                 # controller + wire DTO mapping
├── application/         # use cases/workflows + public capability port
├── domain/              # invariants/value types khi có logic độc lập
├── infrastructure/      # Prisma/provider adapters
└── [context].module.ts
```

Không áp dụng cấu trúc sâu đồng loạt. Một controller/service nhỏ chưa cần bốn layer. Tách khi interface nhỏ hơn và complexity được giấu tốt hơn, không phải để tăng số file.

Connector có thêm adapter/mapper nhưng giữ cùng hướng phụ thuộc:

```txt
Booking application service
  -> VietSage capability port
  -> VietSage HTTP adapter
  -> versioned provider contract
```

Business service không import VietSage HTTP DTO, URL hoặc auth implementation.

## 3. HTTP, validation và authorization

- Global handler trả success/error envelope chuẩn.
- Controller mỏng: parse HTTP, Zod validate, authorization decorator/guard, response mapping.
- Mọi list/detail booking chứa PII phải yêu cầu identity hoặc capability token phù hợp và filter theo owner/property scope ở backend.
- `property_id`/`hotel_id` từ client là input, không phải bằng chứng phân quyền.
- Endpoint trigger sync/reconciliation là admin/internal operation; không public.
- Không dùng `any` tại trust boundary hoặc ép enum để bỏ qua state validation.

## 4. Protocol đặt phòng xuyên hệ thống

### 4.1 Quote

1. Validate `check_out > check_in`, số phòng/khách và hotel/room-type mapping.
2. Lấy availability/price quote có thẩm quyền từ VietSage qua connector.
3. VietSage trả `quote_id`, version, currency, nightly breakdown/policy và expiry.
4. booking-manager áp dụng phần thương mại OTA được phép và trả tổng giá server-calculated.

Projection local chỉ phục vụ discovery/latency. Không dùng nó làm bước xác nhận cuối.

### 4.2 Hold và local booking

1. Gửi hold với `idempotency_key`, `correlation_id`, quote/version và khoảng `[check_in, check_out)`.
2. VietSage atomically kiểm tra/giữ inventory, trả `hold_id`, expiry và authoritative amount/version.
3. Trong local transaction, lưu OTA booking, guest, price/policy snapshot, `hold_id`, correlation và integration operation.
4. Nếu local commit thất bại sau khi hold thành công, gửi cancel cùng correlation; reconciliation phải dọn hold còn sót.

Không giữ local DB transaction mở trong lúc chờ network. Không giả lập distributed transaction.

### 4.3 Payment và confirm

- Payment là state machine riêng: tối thiểu `unpaid/pending/paid/failed/refund_pending/refunded/partially_refunded` khi module được triển khai.
- Chỉ tin webhook/IPN đã verify signature, amount, currency, order reference và replay protection.
- Sau điều kiện payment hợp lệ, gửi confirm hold cùng idempotency key ổn định.
- Chỉ chuyển OTA booking sang `CONFIRMED` khi VietSage xác nhận reservation hoặc reconciliation chứng minh command đã áp dụng.
- Hold hết hạn/payment thất bại: cancel/release idempotent đúng một lần; local state phản ánh kết quả thật.

### 4.4 Cancel và operational status

- Yêu cầu hủy tính theo policy snapshot, gửi cancel command idempotent, sau đó cập nhật payment/refund workflow riêng.
- Check-in, room assignment, no-show, check-out và folio do VietSage sở hữu.
- booking-manager chỉ nhận projection sự kiện/trạng thái cho customer journey; không tự thực thi front-desk transition.

## 5. Dữ liệu và snapshot

- Khoảng ngày: `[check_in, check_out)`; không dùng `Math.abs` để hợp thức hóa ngày đảo ngược.
- Tiền: integer minor units hoặc Decimal; currency bắt buộc. Browser không quyết định `total_price`.
- Booking lưu nightly price, tax/fee/discount, currency và cancellation policy snapshot đủ để giải thích tổng tiền cũ.
- Physical room và daily authoritative inventory không được nhân bản thành ownership local.
- External ID, idempotency key và correlation cần unique constraint phù hợp khi schema được triển khai.

Mọi schema/migration là tác vụ riêng cần phê duyệt; không áp dụng DB migration chỉ vì tài liệu mô tả target.

## 6. Reliability tối thiểu

- Timeout cho mọi provider call; retry chỉ với lỗi transient và cùng idempotency key.
- Mutation timeout sau khi request có thể đã tới provider = `UNKNOWN`; query command/hold/reservation trước khi retry workflow.
- Lưu operation state đủ cho restart và reconciliation; không dựa vào RAM timer cho hold/payment critical.
- Webhook verify trước parse business action; dedupe theo provider event ID; chấp nhận duplicate/out-of-order an toàn.
- Log có request/correlation ID; redact token, secret, PII và payment data.
- Không ghi `SUCCESS` trước phản hồi provider thật.

## 7. Verification gates

| Phạm vi | Gate tối thiểu |
| --- | --- |
| Booking dates/money/snapshot | Focused unit tests cho ngày đảo ngược, boundary đêm, server pricing, snapshot bất biến. |
| Hold/confirm/cancel | Contract tests cho success, duplicate, timeout-after-write, expiry, compensation và reconciliation. |
| Auth/PII | Positive/negative tests cho traveler, partner scope và anonymous access. |
| Webhook/payment | Signature, replay, amount/currency mismatch và duplicate callback tests. |
| VietSage adapter | Provider fixture/OpenAPI compatibility, mapper tests, timeout/status translation. |
| Contract | `node shared/api-contract/scripts/verify-contract.cjs`. |

## 8. Media và notification

Ảnh PMS mặc định được nhận dưới dạng URL/projection từ VietSage. Chưa tạo local storage abstraction cho tới khi có asset OTA-owned thực tế. Khi có, media module sở hữu validation và storage key; business tables không lưu absolute filesystem path.

Email/SMS/push không thuộc booking transaction. Chỉ bổ sung adapter/outbox khi có yêu cầu delivery; không mô phỏng gửi thành công.

## 9. Các seam cần ưu tiên

1. **Booking authorization seam** — mọi query/mutation nhận actor context và enforce owner/property scope trong application service.
2. **Pricing seam** — server nhận booking request, tự resolve quote/snapshot; frontend không gửi total có thẩm quyền.
3. **VietSage capability seam** — `quote`, `hold`, `confirm`, `cancel`, `queryStatus`; một HTTP adapter đáp ứng interface này.
4. **Persistence seam** — chỉ thêm repository khi booking workflow cần transaction/locking hoặc có test adapter thứ hai; không bọc Prisma bằng pass-through class.

Graphify xác định caller/impact set; scoped Repomix và exact source xác nhận seam trước khi refactor.

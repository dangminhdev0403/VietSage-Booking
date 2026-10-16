# Tích hợp booking-manager và VietSage

## 1. Mục đích

`booking-manager` là OTA. `fullstack-vietSage` hiện là modular monolith cung cấp VietSage Core API và là PMS authority. Tích hợp được thiết kế như **service boundary ngay từ đầu**: khi bounded context PMS được tách thành service, booking-manager chỉ đổi endpoint/config/adapter, không đổi domain OTA.

## 2. Boundary bắt buộc

```txt
booking-manager
  Booking Commerce / Catalog Projection
               |
        capability ports
               |
      VietSage Connector (ACL)
               |
      versioned HTTPS/webhook
               |
fullstack-vietSage Core API hôm nay
hoặc VietSage PMS service sau này
```

- Mỗi hệ thống có database/migration riêng.
- Không import source, Prisma schema, repository hoặc shared DB giữa hai repo.
- OpenAPI/event contract là integration boundary; TypeScript type dùng chung chỉ được generate từ contract.
- VietSage DTO được map ở connector, không rò vào controller/domain OTA.
- Base URL, service credential và timeout là configuration; không hard-code provider topology.

## 3. Data ownership

| Capability | Owner | Consumer behavior |
| --- | --- | --- |
| Property/room catalog, PMS media | VietSage | Import projection; giữ external ID/version; không ghi ngược ngoài command được contract cho phép. |
| Inventory/rate/restriction | VietSage | Cache cho search; quote/hold phải hỏi authority. |
| Physical room, allocation, check-in/out, stay/folio | VietSage | Chỉ consume status projection. |
| OTA booking/order/customer journey | booking-manager | Lưu snapshot/correlation; gửi reservation command. |
| OTA payment/markup/promotion | booking-manager | Gửi facts cần thiết; không để VietSage sửa local payment lifecycle. |

## 4. Contract capabilities

Không suy diễn endpoint từ tài liệu này. Endpoint chỉ tồn tại khi có trong OpenAPI provider của VietSage. Contract cần dần cung cấp các capability:

1. Catalog delta/snapshot có cursor hoặc source version.
2. Availability quote có expiry và breakdown.
3. Inventory hold idempotent.
4. Confirm/cancel hold idempotent.
5. Query trạng thái command/hold/reservation.
6. Reservation status event/webhook có event ID và version.
7. Health/readiness cho adapter.

Capability chưa có provider contract là `planned`; booking-manager không tạo fake response để che thiếu hụt.

## 5. Identity, mapping và envelope

Mỗi mutation xuyên hệ thống cần tối thiểu:

```json
{
  "command_id": "opaque-uuid",
  "idempotency_key": "stable-retry-key",
  "correlation_id": "ota-booking-or-workflow-id",
  "source_system": "booking-manager",
  "source_booking_id": "opaque-local-id",
  "occurred_at": "ISO-8601 UTC",
  "contract_version": "v1",
  "payload": {}
}
```

Provider trả ID có thẩm quyền (`quote_id`, `hold_id`, `reservation_id`), trạng thái, expiry/version và correlation. Không dùng tên khách, số điện thoại hoặc booking code dễ đoán làm idempotency key.

Mapping phải phân biệt:

- local OTA ID;
- VietSage external ID;
- source system;
- contract version/source version;
- last reconciled timestamp;
- operation status và last error an toàn.

Unique constraints cho source/external/idempotency được thêm trong migration riêng khi triển khai.

## 6. Flow A — Catalog projection (VietSage → OTA)

1. Trigger bằng scheduled pull hoặc webhook đã verify.
2. Connector lấy delta/snapshot theo cursor/version.
3. Validate provider DTO; map vào projection OTA.
4. Upsert idempotent theo `(source_system, external_id)` và source version.
5. Ghi sync result/cursor; không log payload chứa secret/PII.
6. Mất đồng bộ hoặc partial failure giữ lần projection tốt gần nhất, đánh dấu stale và retry/reconcile.

Ảnh mặc định là URL/provider reference từ VietSage. Chỉ tạo media storage local khi booking-manager có asset OTA-owned.

## 7. Flow B — Quote và hold (OTA → VietSage)

1. booking-manager validate trust boundary và yêu cầu quote authoritative.
2. VietSage tính availability/rate/restriction cho `[check_in, check_out)`.
3. booking-manager áp dụng markup/promotion OTA và tạo quote trả khách với expiry.
4. Khi submit, booking-manager gửi hold bằng cùng quote/version và idempotency key.
5. VietSage atomically giữ inventory, trả `hold_id` + expiry hoặc lỗi sold-out/version-conflict.
6. booking-manager lưu local booking snapshot và correlation.
7. Local commit thất bại sau hold: gửi compensation cancel; reconciliation dọn trạng thái còn nghi ngờ.

## 8. Flow C — Confirm, cancel và payment

- Payment provider callback phải verify độc lập; browser redirect không xác nhận payment.
- Khi điều kiện payment đạt, connector gửi confirm cùng key ổn định.
- `CONFIRMED` local chỉ sau provider confirmation hoặc reconciliation xác minh đã áp dụng.
- Cancel gửi command idempotent, rồi payment/refund tiếp tục trong lifecycle riêng.
- Hold expiry, duplicate command hoặc retry không được reserve/release hai lần.

## 9. Flow D — PMS status (VietSage → OTA)

Webhook/event envelope cần `event_id`, `type`, `version`, `occurred_at`, `producer`, `correlation_id` và payload.

- Verify signature/service identity và timestamp trước xử lý.
- Dedupe theo `event_id`.
- Áp dụng transition monotonic/version-aware; event cũ không ghi đè state mới.
- Trạng thái operational như room assignment/check-in/no-show/check-out vẫn do VietSage sở hữu.
- Callback lỗi trả status phù hợp để retry; không trả success khi chưa persist.

## 10. Mapping lifecycle

Không dùng một enum chung cho ba aggregate:

| Aggregate | Ví dụ state | Owner |
| --- | --- | --- |
| OTA booking | draft/pending_payment/held/confirmed/cancel_pending/cancelled/expired/sync_unknown | booking-manager |
| Payment | unpaid/pending/paid/failed/refund_pending/refunded/partially_refunded | booking-manager/payment provider |
| PMS reservation/stay | provider-defined reservation, arrival, checked-in, no-show, checked-out states | VietSage |

Connector giữ bảng mapping có version. Provider state mới chưa biết phải vào `UNKNOWN_PROVIDER_STATE`/quarantine và cảnh báo; không ép cast sang enum local.

## 11. Failure semantics

| Tình huống | Xử lý |
| --- | --- |
| Timeout trước khi gửi | Retry bounded với cùng key. |
| Timeout sau khi có thể đã gửi | Đánh dấu `UNKNOWN`; query status; retry cùng key; reconciliation. |
| `4xx` validation/auth | Không retry mù; lưu safe error; sửa request/config. |
| `409` sold-out/version conflict | Refresh quote; trả domain error rõ ràng. |
| `429`/`5xx`/network | Exponential backoff + jitter, giới hạn attempt, circuit/alert phù hợp. |
| Duplicate webhook/command | Trả kết quả đã lưu; không lặp side effect. |
| Out-of-order event | So version/occurred_at; không lùi state. |
| Local/provider lệch | Reconciliation theo correlation/external ID; audit mọi manual override. |

Không cần broker ở baseline. Nhưng operation critical phải lưu bền vững để restart không mất retry. Nếu volume/reliability yêu cầu worker riêng, bổ sung outbox/queue mà giữ nguyên capability contract.

## 12. Security

- Machine-to-machine auth dùng short-lived token, mTLS hoặc signed request theo provider contract; secret chỉ ở secret store/env.
- Webhook verify signature, timestamp/tolerance và replay key.
- Principle of least privilege theo hotel/tenant và capability.
- TLS bắt buộc ngoài local development.
- Redact Authorization, API key, token, signature, guest PII và payment data khỏi log.
- Sync/reconciliation endpoint không public; yêu cầu permission và audit.

## 13. Contract evolution và rollout

1. VietSage thêm capability additive và export OpenAPI/event schema.
2. Provider deploy trước nếu change additive; giữ backward compatibility.
3. booking-manager pin/validate provider contract, cập nhật mapper và contract tests.
4. OTA deploy consumer; bật feature/config sau health check.
5. Breaking change tạo version mới, chạy song song, migrate consumer rồi retire version cũ.

Không yêu cầu hai repo deploy cùng thời điểm. Mọi rollout phải có backward-compatible window và rollback không làm mất mapping/correlation.

## 14. Readiness để VietSage thành service riêng

Boundary đạt chuẩn khi:

- không còn deep import/shared DB/shared migration;
- capability contract ổn định và versioned;
- idempotency/correlation/query-status đầy đủ;
- provider sở hữu transaction inventory/reservation;
- auth, readiness, observability và SLO được xác định;
- reconciliation chạy được sau restart;
- đổi provider base URL không yêu cầu sửa Booking Commerce;
- contract tests chạy với cả Core API hiện tại và service candidate trước cutover.

Việc tách/deploy/cutover là protected operation riêng; tài liệu này không tự cho phép triển khai production.

## 15. Cấu hình

Chỉ tài liệu hóa tên, không ghi giá trị:

```env
VIETSAGE_API_BASE_URL=
VIETSAGE_SERVICE_TOKEN=
VIETSAGE_WEBHOOK_SECRET=
VIETSAGE_REQUEST_TIMEOUT_MS=
VIETSAGE_RECONCILIATION_INTERVAL=
```

Tên biến hiện hữu có thể được giữ tương thích trong adapter; đổi tên/config là tác vụ riêng.

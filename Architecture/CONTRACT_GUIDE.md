# Hướng dẫn contract

## 1. Hai contract, hai owner

### Public OTA API

Contract có thẩm quyền của `booking-manager`:

```txt
shared/api-contract/openapi/v1/openapi.json
```

Mirrors bắt buộc đồng bộ:

- `shared/api-contract/openapi/v1/openapi.yaml`
- `share_api.json`
- `frontend-booking/config/share_api.json`

### VietSage provider API

VietSage sở hữu và export OpenAPI/event schema của provider. `booking-manager` consume contract đó qua connector; không xem controller/source/DB của VietSage là integration contract.

`booking-manager` public OpenAPI không thay thế provider OpenAPI. Chỉ đưa integration endpoint vào public OTA contract nếu frontend/partner thực sự gọi endpoint đó.

## 2. Quy ước OTA API

| Rule | Specification |
| --- | --- |
| Prefix | `/api/v1` |
| JSON | `snake_case` ngoài wire; `camelCase` nội bộ |
| Date/time | ISO-8601; timestamp UTC, business date `YYYY-MM-DD` theo hotel timezone |
| Money | Integer minor units hoặc decimal string chính xác; currency bắt buộc cho quote/payment |
| Pagination | `items`, `page`, `page_size`, `total`, `has_next` |
| Success | `{ "success": true, "data": ..., "meta": ... }` |
| Failure | `{ "success": false, "error": { "code": ..., "message": ..., "details": ... }, "request_id": ... }` |

## 3. Integration contract requirements

Mutation VietSage phải định nghĩa:

- `Idempotency-Key` hoặc trường idempotency tương đương;
- `command_id` và `correlation_id`;
- timeout/retry-safe response;
- trạng thái queryable khi outcome không xác định;
- stable provider error codes cho validation, auth, sold-out/conflict, rate limit và transient failure;
- `quote_id`/`hold_id`/`reservation_id`, version và expiry khi áp dụng.

Webhook/event phải định nghĩa signature/auth header, timestamp/replay window, `event_id`, event version, producer, correlation và duplicate response semantics. Secret value không nằm trong spec/example.

## 4. Compatibility

- Trong cùng major version, thay đổi là additive: thêm optional field/operation/state có fallback rõ ràng.
- Không đổi nghĩa hoặc type của field hiện hữu.
- Breaking change tạo version mới và chạy song song trong migration window.
- Consumer phải xử lý provider enum chưa biết bằng quarantine/unknown state, không crash hoặc ép cast.
- Provider deploy additive trước; consumer deploy sau; retire contract cũ cuối cùng.

## 5. Implementation status

- `implemented`: route và workflow local tương ứng tồn tại; production readiness vẫn phụ thuộc quality gates và runtime verification.
- `planned`: route chưa có, chỉ là scaffold/stub, hoặc provider capability chưa tồn tại.
- Không dùng fake success để đạt `implemented`.
- Markdown endpoint tables không phải source of truth; generate/verify từ OpenAPI.

## 6. Verification

```bash
node shared/api-contract/scripts/verify-contract.cjs
```

Script hiện kiểm tra OTA JSON/YAML, operation status và hai status mirrors. Khi connector thật được triển khai, thêm focused provider compatibility test dựa trên VietSage OpenAPI/event fixtures; không hand-maintain bản sao endpoint trong nhiều Markdown file.

Một thay đổi liên repository hoàn tất khi:

1. provider export/verify contract;
2. booking-manager pin hoặc validate version mới;
3. mapper/adapter contract tests pass;
4. public OTA OpenAPI/mirrors cập nhật nếu public behavior đổi;
5. rollout order và rollback tương thích được ghi trong task plan.

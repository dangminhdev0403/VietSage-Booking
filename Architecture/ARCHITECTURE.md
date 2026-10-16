# Kiến trúc booking-manager (OTA Platform)

## 1. Quyết định kiến trúc

`booking-manager` là kênh **Online Travel Agency (OTA)**. Hệ thống sở hữu trải nghiệm tìm kiếm/đặt phòng, thương mại OTA, thanh toán trước lưu trú và self-service của khách.

**VietSage** là **Property Management System (PMS)**. VietSage sở hữu vận hành khách sạn, phòng vật lý, tồn/giá/restriction có thẩm quyền, reservation/stay, phân phòng và check-in/check-out.

Hai hệ thống là hai deployment và hai database độc lập. Chúng giao tiếp qua contract có version và Anti-Corruption Layer (ACL). Ranh giới này giữ nguyên nếu phần PMS của `fullstack-vietSage` được tách thành service riêng sau này.

## 2. Runtime model

| Layer | Công nghệ | Quyền sở hữu |
| --- | --- | --- |
| Web presentation | Next.js 16 + React 19 + Tailwind CSS 4 | UI OTA, customer self-service, partner/admin views và BFF. Không chứa business rule hoặc truy cập DB trực tiếp. |
| OTA API core | NestJS 11 modular monolith | Identity OTA, catalog projection, booking intent/order, snapshot thương mại, payment orchestration, audit và VietSage connector. |
| OTA database | PostgreSQL + Prisma | Dữ liệu do `backend-booking` sở hữu và các projection/cache nhận từ VietSage. Không phải PMS database. |
| Public contract | `/api/v1`, OpenAPI | Ranh giới giữa frontend/BFF và OTA API. |
| PMS provider boundary | Versioned HTTPS API/webhook/event contract | Ranh giới duy nhất tới VietSage. Không import source, không query chung DB. |

```txt
Customer / Partner / Admin
  -> Next.js / BFF
  -> booking-manager API
       -> OTA PostgreSQL
       -> VietSage Connector (ACL)
            -> VietSage Core API hôm nay
            -> VietSage PMS service sau này (không đổi OTA domain)
```

Không đưa API gateway, broker hoặc distributed transaction vào baseline khi chưa có nhu cầu đo được. Độ bền của command tích hợp được bảo đảm bằng idempotency, trạng thái bền vững và reconciliation; broker có thể bổ sung sau mà không đổi domain contract.

## 3. Quyền sở hữu dữ liệu

| Dữ liệu/quy trình | Nguồn có thẩm quyền | booking-manager được giữ |
| --- | --- | --- |
| Hotel/property, room type, amenities, ảnh PMS | VietSage | Projection phục vụ tìm kiếm/hiển thị; external ID và source version. |
| Phòng vật lý, trạng thái phòng, phân phòng | VietSage | Không sở hữu; chỉ hiển thị projection nếu contract cần. |
| Daily inventory, base rate, restriction | VietSage | Projection có timestamp/version; không dùng projection để xác nhận bán cuối cùng. |
| OTA markup, promotion, add-on do OTA bán | booking-manager | Rule/snapshot thương mại do OTA sở hữu. |
| Availability quote và inventory hold | VietSage | Quote/hold ID, expiry và snapshot phản hồi. |
| OTA booking/order và customer journey | booking-manager | Booking code, khách, snapshot giá/phí/chính sách, payment state và correlation. |
| PMS reservation/stay, check-in/out, folio | VietSage | External reservation ID và operational status projection. |
| Thanh toán OTA | booking-manager/provider thanh toán | Payment lifecycle riêng; chỉ truyền settlement facts cần thiết sang VietSage. |

Projection không chuyển quyền sở hữu. Khi dữ liệu local khác VietSage, dữ liệu VietSage thắng đối với PMS inventory/rate/operation; dữ liệu OTA thắng đối với order/payment/markup do OTA sở hữu.

## 4. Bounded contexts

1. **Identity & Access** — tài khoản OTA, session, role/permission, authorization và audit.
2. **Catalog Projection & OTA Merchandising** — projection hotel/room từ VietSage; nội dung, promotion và add-on do OTA sở hữu được tách rõ theo source.
3. **Availability Projection** — cache/projection để tìm kiếm nhanh; không phải authority cho hold/confirm.
4. **Booking Commerce** — booking intent/order, guest, snapshot giá/chính sách, payment orchestration và customer self-service.
5. **VietSage Connector (ACL)** — mapping ID, DTO translation, quote/hold/confirm/cancel, webhook ingestion, retry và reconciliation.

`booking-manager` không sở hữu front-desk workflow. Các trạng thái `CHECKED_IN`/`COMPLETED` hiện có chỉ là compatibility projection cho tới khi contract lifecycle được chuẩn hóa; không mở rộng chúng thành PMS logic local.

## 5. Dependency direction

```txt
Route / Component
  -> Feature API client
  -> BFF hoặc /api/v1
  -> Controller
  -> Application service
  -> Owning repository hoặc integration port
  -> OTA DB hoặc VietSage adapter
```

- Controller chỉ map HTTP, validate DTO và map response.
- Application service sở hữu workflow, authorization và local transaction.
- Repository chỉ truy cập bảng của context sở hữu.
- Mọi cấu trúc VietSage được dịch tại connector; domain OTA không phụ thuộc DTO/provider path.
- Không chia sẻ Prisma client, migration, table hoặc foreign key giữa hai repository.

## 6. Invariants đặt phòng

- Khoảng lưu trú là `[check_in, check_out)`; `check_out` phải sau `check_in`.
- Tiền dùng integer minor unit hoặc decimal chính xác; không dùng floating-point cho quyết định tài chính.
- Server tính và lưu snapshot giá, tiền tệ, thuế/phí, promotion và chính sách hủy. Không tin `total_price` từ browser.
- VietSage thực hiện kiểm tra cạnh tranh và giữ tồn có thẩm quyền.
- Quote/hold/confirm/cancel là command idempotent. Timeout sau khi gửi là trạng thái **không xác định**, không được coi là thất bại; retry cùng key rồi query/reconcile.
- Booking lifecycle và payment lifecycle độc lập.
- Không dùng distributed transaction. Partial failure phải có compensation và reconciliation rõ ràng.

Chi tiết giao thức: [`INTEGRATION_GUIDE.md`](INTEGRATION_GUIDE.md). Quy tắc backend: [`BACKEND_GUIDE.md`](BACKEND_GUIDE.md).

## 7. Contract boundary

`shared/api-contract/openapi/v1/openapi.json` là contract public có thẩm quyền của `booking-manager`.

Contract provider của VietSage do OpenAPI/event contract xuất từ VietSage sở hữu. Connector chỉ dùng capability đã có trong contract provider được pin/version; endpoint chưa tồn tại phải giữ trạng thái `planned`, không mô phỏng thành công.

JSON ngoài hệ thống dùng `snake_case`; TypeScript/Prisma nội bộ dùng `camelCase`. Thay đổi contract liên repository phải additive trong cùng major version hoặc tạo version mới, có thứ tự rollout tương thích.

## 8. Điều kiện tách VietSage thành service

Không cần tách VietSage ngay. Boundary này được xem là sẵn sàng khi:

- booking-manager chỉ gọi provider qua connector và base URL/config;
- provider contract có version, idempotency và auth machine-to-machine;
- VietSage sở hữu hoàn toàn transaction inventory/reservation;
- external IDs/correlation được lưu bền vững;
- webhook được verify, chống replay và xử lý duplicate/out-of-order;
- health/readiness, timeout, retry, reconciliation và rollback đã được kiểm thử;
- việc đổi từ VietSage Core API sang service mới chỉ đổi adapter/config, không đổi Booking Commerce.

## 9. Ổn định cấu trúc và hướng tiến hóa

Cấu trúc hiện tại **đủ ổn định để tiếp tục theo modular monolith**, chưa có import cycle và chưa có bằng chứng cần tách microservice. Vấn đề chính là source còn ở mức vertical slice phẳng, trong khi docs mô tả target sâu hơn thực tế.

Nguyên tắc tiến hóa:

1. Giữ `backend-booking/src/modules/<context>` làm đơn vị ownership; chỉ thêm `application`, `domain`, `infrastructure`, `api` khi module có logic thực sự cần tách. Không tạo folder rỗng để khớp sơ đồ.
2. Giữ route `app/**/page.tsx` làm shell. Workflow/network call đi qua feature client → resource → hook; BFF route handler dùng cho auth, secret-bearing hoặc server-only orchestration.
3. `common/` chỉ giữ HTTP/auth primitives dùng từ ít nhất hai context. Logic domain quay về module sở hữu.
4. `shared/api-contract` chỉ chứa wire contract/generated validators; không trở thành shared-domain dumping ground.
5. VietSage connector là seam đầu tiên cần làm sâu: capability port nhỏ, adapter HTTP riêng, mapper và durable operation state. Không mở rộng service mô phỏng hiện tại.
6. Dùng Graphify để kiểm tra caller/import/impact trước refactor; source/test xác nhận mọi kết luận.

Thứ tự hardening tối thiểu:

1. Đóng auth/PII boundary của booking và sync endpoint.
2. Loại direct page-to-network; đưa sync/admin workflow vào feature/BFF/resource seam.
3. Chuẩn hóa server-calculated pricing, date validation và booking state transition.
4. Triển khai VietSage provider contract, idempotency và reconciliation.
5. Chỉ sau đó cân nhắc tách persistence/application folders hoặc service extraction theo kích thước và operational evidence.

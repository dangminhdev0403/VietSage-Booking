# Bản đồ bounded context

Tài liệu này xác định quyền sở hữu domain và hướng phụ thuộc của `booking-manager`. Tên model dưới đây phản ánh schema hiện tại; authority column là quy tắc mục tiêu bắt buộc cho các thay đổi tiếp theo.

## 1. Ownership

| Context | Module hiện tại/mục tiêu | Model local hiện tại | Authority và trách nhiệm |
| --- | --- | --- | --- |
| **Identity & Access** | `IdentityAccessModule` | `Account`, `Role`, `Permission`, `RolePermission`, `AccountRoleAssignment`, `RefreshSession`, `AuditEvent` | OTA auth/session/RBAC/audit. Mọi thao tác quản lý kiểm tra actor và resource scope tại backend. |
| **Catalog Projection & Merchandising** | `CatalogModule` | `Property`, `RoomType`, `AddonService` | `Property`/`RoomType` là projection của VietSage khi integration bật. `AddonService` chỉ local-authoritative cho sản phẩm OTA; dữ liệu PMS phải mang origin/external ID riêng. |
| **Availability Projection** | `InventoryRatesModule` (planned boundary) | `RoomAllotment` | Cache tìm kiếm từ VietSage. Không xác nhận sellability hoặc decrement inventory có thẩm quyền. |
| **Booking Commerce** | `BookingsModule` | `Booking`, `BookingAddon` | OTA order, guest, snapshot thương mại, customer workflow và correlation với PMS. Không sở hữu phòng vật lý/check-in/out. |
| **Payments** | `PaymentsModule` (planned) | Chưa có payment aggregate | Payment intent/webhook/refund/reconciliation; lifecycle độc lập booking. Không đánh dấu thanh toán từ browser callback. |
| **Customer Management** | `CustomerModule` (planned) | Chưa có profile aggregate riêng | Hồ sơ và lịch sử OTA trong phạm vi người dùng. |
| **VietSage Connector (ACL)** | `VietSageSyncModule` | `VietSageSyncLog` | Provider adapter, ID mapping/correlation, command state, webhook ingress và reconciliation. `VietSageSyncLog` hiện tại chưa đủ để suy ra integration production-ready. |

`PropertyMapping`, payment aggregate, durable command/outbox hoặc các model khác chỉ được thêm bằng thay đổi schema/migration đã được phê duyệt. Tài liệu không làm chúng thành implementation hiện hữu.

## 2. Public capabilities

Domain OTA chỉ phụ thuộc capability, không phụ thuộc endpoint/provider DTO:

- Catalog projection import.
- Availability quote.
- Inventory hold, confirm, cancel và query trạng thái command.
- Reservation status projection.
- Reconciliation theo correlation/external ID.

Các capability đi qua connector. Khi VietSage chuyển từ Core API sang service riêng, adapter/config có thể đổi; caller trong Booking Commerce giữ nguyên.

## 3. Dependency và invariants

1. **Private database** — không query hoặc write DB của VietSage; VietSage không query DB OTA.
2. **No shared writes** — module local không ghi table của context khác; dùng public application service/port.
3. **Opaque references** — cross-context dùng ID/correlation, không deep import repository hoặc Prisma implementation.
4. **PMS authority** — inventory/rate/restriction/physical room/reservation operation do VietSage quyết định.
5. **Projection semantics** — mọi projection cần source ID, source version hoặc updated timestamp; stale data không được confirm booking.
6. **Booking invariant** — booking chỉ `CONFIRMED` sau khi command confirm của VietSage và quy tắc payment tương ứng thành công.
7. **Unknown outcome** — timeout sau mutation tạo trạng thái cần query/reconcile, không tạo command mới.
8. **Audit** — mutation booking/payment/permission và integration override phải có audit không chứa secret/PII dư thừa.
9. **Lifecycle isolation** — OTA booking, payment và PMS reservation/stay là các state machine riêng; mapping nằm trong connector.
10. **No fake integration** — adapter chưa gọi provider thật phải trả trạng thái unavailable/planned, không ghi `SUCCESS` giả.

## 4. Legacy compatibility

Schema hiện tại có `RoomAllotment` và các trạng thái `CHECKED_IN`, `COMPLETED`. Chúng không cấp quyền sở hữu PMS cho booking-manager. Thay đổi sau phải dần chuyển chúng thành projection hoặc loại bỏ bằng migration riêng đã được phê duyệt; không tự áp dụng migration trong tác vụ code thông thường.

## 5. Mức trưởng thành cấu trúc

| Context | Hiện trạng source | Bước chuẩn hóa tiếp theo |
| --- | --- | --- |
| Identity & Access | Module thật; service/controller/guards đã tồn tại. | Giữ nguyên module; tách repository/port chỉ khi auth service tiếp tục phình hoặc có adapter thứ hai. |
| Catalog Projection | Module thật nhưng CRUD local chưa biểu diễn rõ source ownership. | Thêm origin/external mapping trong thay đổi schema riêng; tách OTA merchandising khỏi PMS projection khi contract thật xuất hiện. |
| Booking Commerce | Module thật nhưng service đang gom validation, pricing, persistence và response mapping. | Ưu tiên một application workflow sâu; thêm persistence adapter khi hold/snapshot transaction được triển khai, không chia file cơ học trước. |
| Availability Projection | Chưa có module thật; `RoomAllotment` nằm trong schema. | Chỉ tạo module khi có provider projection/availability use case thật. |
| Payments | Chưa có module/model thật. | Chỉ scaffold sau khi payment policy/provider được chốt. |
| VietSage Connector | Module thật nhưng provider call hiện là simulation. | Tạo capability port + real HTTP adapter + mapper + durable operation/reconciliation; giữ caller độc lập topology provider. |

Graph baseline không phát hiện import cycle. Không tách service hoặc thêm layer chỉ vì community cohesion thấp; kiểm tra exact source và business seam trước.

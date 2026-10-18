# Frontend Architecture Guide

## 1. Overview

`frontend-booking` is a Next.js 16 App Router application engineered for high-converting, intuitive, and lightning-fast OTA booking journeys.

## 2. Current and target directory structure

Repo hiện đã có `app/`, `features/`, `components/ui`, `lib/`, `providers/` và `config/`. Sơ đồ dưới là hướng tiến hóa theo nhu cầu, không cho phép tạo sẵn route/folder rỗng:

```txt
frontend-booking/
├── app/
│   ├── (public)/                 # Guest facing search, discovery, and booking
│   │   ├── properties/
│   │   ├── checkout/
│   │   └── page.tsx              # OTA Hero, destination search, deals
│   ├── admin/                    # Partner & platform operator shell
│   │   ├── properties/
│   │   ├── bookings/
│   │   ├── services/
│   │   └── page.tsx
│   ├── api/                      # Next.js BFF Route Handlers
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── layouts/                  # Navigation, header, footer
│   └── shared/                   # Atomic presentation primitives (Button, Modal, Card)
├── features/
│   ├── auth/                     # Authentication & session feature
│   ├── catalog/                  # Property, room type, and add-on services
│   ├── inventory/                # Chỉ tạo khi availability projection use case tồn tại
│   └── bookings/                 # Booking list, checkout wizard, status management
├── lib/
│   ├── api/                      # Backend client, fetch wrappers, and Zod schemas
│   ├── query/                    # TanStack QueryClient and QueryProvider
│   └── store/                    # Zustand stores with safe persistent storage
└── config/
    └── share_api.json            # Synchronized contract mirror
```

## 3. Server-State Standard Pattern

All remote server data fetching and mutations must follow the 4-layer standard:

```txt
1. Feature API Client (lib/api/backend.ts + features/[domain]/service/[domain].client.ts)
   ↓
2. Query Resource (features/[domain]/service/[domain].resource.ts via @dangminhdev04032005/query-resource)
   ↓
3. Feature Hook (features/[domain]/hooks/use-[domain].ts)
   ↓
4. UI Component (features/[domain]/components/[component].tsx)
```

Route handler BFF đứng giữa component/feature client và backend khi cần session propagation, secret, cookie hoặc server-only orchestration. Public read không mặc định cần thêm BFF pass-through.

Route page không gọi `backendFetch` trực tiếp. Graph baseline hiện phát hiện `app/admin/page.tsx → backendFetch()` cho VietSage sync; đây là legacy deviation cần chuyển vào feature client/resource/hook hoặc BFF khi triển khai connector thật, không phải pattern để sao chép.

Example Resource:
```typescript
import { createResource, defineQuery, defineMutation } from "@dangminhdev04032005/query-resource";
import { listProperties, getProperty } from "./catalog.client";

export const propertyResource = createResource<void>()({
  namespace: ["booking-manager"],
  name: "properties",
  scopeKey: () => ["public"],
  queries: {
    list: defineQuery({
      inputKey: (filter?: PropertyFilter) => [filter?.city ?? "", filter?.keyword ?? ""],
      queryFn: ({ input }) => listProperties(input),
    }),
    detail: defineQuery({
      inputKey: (id: string) => [id],
      queryFn: ({ input }) => getProperty(input),
    }),
  },
  mutations: { /* ... */ }
});
```

## 4. UI Design, Typography & Ruthless Pruning Standards

Tất cả giao diện khách (guest-facing) và đối tác/quản trị (admin/partner) của `frontend-booking` phải tuân thủ chuẩn thiết kế thương mại OTA cao cấp (Booking.com / Agoda benchmark): dứt khoát, minh bạch, dễ thao tác và tối ưu chuyển đổi.

### 4.1. Quy chuẩn kích thước chữ (Typography Floor & Legibility)
- **Sàn kích thước tối thiểu (Floor Limit)**: CẤM TUYỆT ĐỐI font size dưới 12px (0.75rem / `text-xs`). Nghiêm cấm sử dụng các class micro-font tuỳ tiện như `text-[10px]`, `text-[11px]`, `text-[9px]`, `text-[8px]`.
- **Hệ thống phân cấp Typography (Scale & Semantic Role)**:
  - `text-xs` (12px / 0.75rem): Chỉ dùng cho badge trạng thái nhỏ, timestamp gọn, tag tiện ích phụ, breadcrumbs, caption ngắn. Bắt buộc độ tương phản (contrast ratio) ≥ 4.5:1. Cấm kết hợp font 12px với tracking quá rộng (`tracking-[0.2em]`) hoặc màu chữ mờ nhạt gây khó đọc.
  - `text-sm` (14px / 0.875rem): Chuẩn cho body text thông thường, mô tả ngắn gọn, cell dữ liệu bảng (table cell), filter options, nhãn phụ (secondary labels).
  - `text-base` (16px / 1rem): Chuẩn cho primary body, nội dung input form, nút bấm chính, liên kết navigation, tóm tắt chính của thẻ (card primary text).
  - `text-lg` - `text-xl` (18px - 20px): Tiêu đề section con, tên khách sạn/hạng phòng trên card, hiển thị giá tiền nổi bật (prominent price).
  - `text-2xl` - `text-4xl` (24px - 36px): Tiêu đề chính trang (page title), hero headline.
- **Tương phản & Dễ đọc**: Tuyệt đối không dùng chữ xám nhạt trên nền trắng/sáng (như `text-gray-300`, `text-slate-300` trên nền sáng). Mọi text phải đạt chuẩn WCAG AA.

### 4.2. Chuẩn nội dung & Tiêu chuẩn chống sáo rỗng (Zero-Fluff Copywriting)
- **Cấm văn bản sáo rỗng, hoa mỹ, sến súa**:
  - Cấm các khẩu hiệu quảng cáo rập khuôn, vô nghĩa: ví dụ *"Kỳ nghỉ thượng lưu • Trọn vẹn từng khoảnh khắc"*, *"Đỉnh cao trải nghiệm nghỉ dưỡng"*, *"Chào mừng bạn đến với hệ thống đặt phòng"*.
  - Cấm chèn câu mô tả hiển nhiên dưới tiêu đề (ví dụ: dưới tiêu đề *"Danh sách đặt phòng"* không chèn *"Xem và quản lý toàn bộ các đơn đặt phòng của hệ thống"*). Nếu tiêu đề đã rõ nghĩa, không thêm text phụ vô bổ.
  - Cấm tuyệt đối placeholder của lập trình viên: *"Lorem ipsum"*, *"test 123"*, *"TODO"*, *"placeholder"*.
- **Văn phong OTA thương mại dứt khoát (High-Signal OTA Phrasing)**:
  - Tập trung 100% vào thông số thúc đẩy quyết định đặt phòng: *"Xác nhận tức thì"*, *"Miễn phí huỷ trước [ngày/giờ]"*, *"Bao gồm bữa sáng"*, *"Chỉ còn [X] phòng trống"*, *"Giá cuối cùng đã gồm thuế & phí"*.
  - Màn hình Admin: Sử dụng ngôn từ tác vụ ngắn gọn, chính xác: *"Đồng bộ phòng trống"*, *"Huỷ đơn"*, *"Xác nhận thanh toán"*, *"Khoá allotment"*.
  - Tiếng Việt chuẩn mực, chuẩn xác về thuật ngữ ngành khách sạn (OTA/Hospitality), không dùng tiếng lóng hoặc mã lỗi kỹ thuật chưa qua xử lý (`raw error code`) hiển thị trực tiếp cho khách.

### 4.3. Loại bỏ thành phần UI thừa thãi (Ruthless UI Pruning)
- **Nguyên tắc "Mọi pixel đều phải có mục đích" (Every Pixel Must Earn Its Place)**:
  - **Cấm hội chứng Card lồng Card (Nested Cards)**: Không bọc card bên trong card chỉ để trang trí viền. Tối ưu không gian bằng padding và khoảng trắng (whitespace) tự nhiên thay vì viền border/shadow dày đặc.
  - **Cấm thành phần giao diện trùng lặp trên cùng màn hình (Duplicate Controls)**: Không tạo nhiều khối hoặc nút bấm cùng làm một hành động trên một viewport (ví dụ: trang 404 hoặc trang lỗi không được có 2 cụm nút quay về trang chủ khác nhau).
  - **Cấm banner/ảnh khổng lồ vô nghĩa**: Không chèn banner ảnh lớn chiếm diện tích màn hình mà bên trong chỉ chứa lại thông tin đã hiển thị ở phần trên.
  - **Cấm hiệu ứng hào quang mờ ảo tràn lan**: Hạn chế tối đa các khối blur trang trí (`blur-[160px]`, glowing orbs) làm giảm độ tương phản và gây sao nhãng thao tác người dùng.
  - **Cấm fake statistics / decorative badges**: Chỉ render component, nút bấm hoặc badge khi có dữ liệu thật hoặc tính năng khả dụng. Không tạo badge trang trí vô nghĩa trên từng dòng chữ.

### 4.4. Kiểm tra tự động & Miễn trừ lệnh thừa (Zero-Waste UI Gate)
- **Quy tắc miễn trừ kiểm thử khi sửa UI**:
  - Khi chỉnh sửa UI, CSS, Tailwind classes, khoảng cách, màu sắc, JSX layout, copy/text hoặc thêm presentation components:
    - **CẤM CHẠY**: Test suites (`pnpm test`, `jest`, `vitest`, `playwright`), full-repo lint (`eslint .`), hoặc build bundling (`next build`).
    - **Chỉ chạy lệnh tĩnh duy nhất**:
      ```bash
      node scripts/verify-ui-rules.cjs
      ```
      Nếu có thêm imports/types mới, chạy thêm scoped `pnpm --dir frontend-booking exec tsc --noEmit`.
- **Tự động sửa lỗi sàn font**:
  ```bash
  node scripts/verify-ui-rules.cjs --fix
  ```

## 5. Progressive extraction

- Page dưới khoảng một workflow có thể giữ layout JSX tại route; tách feature component khi có reuse, độc lập test hoặc page trộn data orchestration với presentation.
- Feature sở hữu types/client/resource/hook/components của mình. `lib/` chỉ chứa primitive dùng chéo feature.
- Không tạo global store cho server state; Zustand chỉ cho client state thực sự shared/persistent.
- Không tạo index barrel toàn feature nếu nó che import cycle hoặc làm Graphify mất seam rõ ràng.


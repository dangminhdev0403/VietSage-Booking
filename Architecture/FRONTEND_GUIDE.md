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

### 4.4. Quy chuẩn chống gãy dòng chữ mồ côi & Phân cấp cấu trúc đầu đề (Typographic Balance, Anti-Widow/Orphan & Header Hierarchy)
- **Chống gãy dòng chữ mồ côi (Anti-Widow / Anti-Orphan Layout Standard)**:
  - **Headings (`h1`, `h2`, `h3`, `h4`, card titles, modal titles)**: Bắt buộc áp dụng class `text-balance` (tương đương CSS `text-wrap: balance`). Trình duyệt sẽ tự động phân bổ độ dài giữa các dòng cân xứng, triệt tiêu hoàn toàn tình trạng 1-2 từ cuối cùng (như *"Khách Sạn"*, *"Hệ Thống"*, *"Nghỉ Dưỡng"*) bị rớt xuống dòng thứ 2 một cách trơ trọi, cộc lốc ("gãy dòng ngứa mắt").
  - **Đoạn văn mô tả (Body copy, Subtitles, Descriptions)**: Áp dụng class `text-pretty` (CSS `text-wrap: pretty`) cho các đoạn văn từ 2 dòng trở lên để ngăn chặn từ đơn rơi vào dòng cuối.
  - **Badges, Tags, Status Pills, Action Buttons**: Bắt buộc gắn `whitespace-nowrap` để chống tình trạng chữ trong badge/pill bị bẻ đôi sang dòng mới khi co giãn màn hình responsive.
  - **Độ cô đọng của tiêu đề (Headline Conciseness)**: Giữ tiêu đề súc tích, nằm trọn trong chiều ngang tự nhiên của khung chứa. Thay vì nhồi nhét tiêu đề dài 40 ký tự, hãy chọn từ ngữ dứt khoát: ví dụ dùng *"Đăng nhập hệ thống"* thay vì *"Đăng nhập Quản trị & Đối tác Khách sạn"*.

- **Cấm hội chứng "Bánh kẹp 3 tầng lặp ý" (Anti-Triple-Stacking & Semantic Partitioning)**:
  - **Hiện tượng cấm**: Cùng một cụm header xếp chồng 3 dòng liên tiếp nói lại cùng một nội dung (ví dụ: Badge nói *"CỔNG DÀNH CHO CÁN BỘ & ĐỐI TÁC"*, H1 nói *"ĐĂNG NHẬP QUẢN TRỊ & ĐỐI TÁC KHÁCH SẠN"*, Subtitle lại nói *"Dành riêng cho Quản trị viên và Đối tác vận hành khách sạn, resort..."*).
  - **Quy tắc phân tầng ngữ nghĩa độc lập (Single Source of Intent)**:
    - **Eyebrow / Badge**: Chỉ định vị Khu vực / Vai trò / Danh mục (ví dụ: `Cổng Quản Trị & Đối Tác`).
    - **H1 / Primary Heading**: Chỉ định Hành động chính hoặc Thực thể cốt lõi (ví dụ: `Đăng Nhập Hệ Thống`). Không lặp lại danh từ của Eyebrow.
    - **Subtitle / Description**: Chỉ cung cấp Hướng dẫn hành động hoặc Phạm vi giá trị cụ thể. Tuyệt đối không lặp lại tiêu đề. Nếu không có thông tin mới -> BỎ HẲN SUBTITLE.

- **Chuẩn tỷ lệ khung chứa & chiều rộng dòng chữ (Container-Scale & Reading Ergonomics)**:
  - Các form đơn như Auth / Đăng nhập / Khôi phục mật khẩu / Hộp thoại xác nhận: Chiều rộng khung thẻ tối đa chỉ từ `max-w-md` (448px) đến `max-w-lg` (512px). Tuyệt đối không kéo rộng `max-w-2xl` cho form đơn lẻ khiến bố cục bị bè ngang, khoảng cách các trường bị loãng và tiêu đề dễ gãy dòng.
  - Các đoạn văn bản đọc: Giới hạn độ rộng tối đa `max-w-prose` hoặc `max-w-xl` (~65-75 ký tự/dòng) để người đọc không phải đảo mắt quá rộng.

- **Chuẩn hóa nhãn nhập liệu & Placeholder (Form Ergonomics)**:
  - CẤM nhãn viết hoa toàn bộ (ALL-CAPS screaming labels như `TÊN ĐĂNG NHẬP HOẶC EMAIL CÔNG TÁC`). Dùng Title Case hoặc Sentence Case gọn gàng (`Tài khoản hoặc email công tác`).
  - Placeholder chỉ là gợi ý định dạng ngắn gọn (ví dụ: `admin@vietsage.vn hoặc tên đăng nhập`), không viết thành câu văn dài lòng thòng (`Nhập tên đăng nhập quản trị hoặc đối tác...`).

### 4.5. Kiểm tra tự động & Miễn trừ lệnh thừa (Zero-Waste UI Gate)
- **Quy tắc miễn trừ kiểm thử khi sửa UI**:
  - Khi chỉnh sửa UI, CSS, Tailwind classes, khoảng cách, màu sắc, JSX layout, copy/text hoặc thêm presentation components:
    - **CẤM CHẠY**: Test suites (`pnpm test`, `jest`, `vitest`, `playwright`), full-repo lint (`eslint .`), hoặc build bundling (`next build`).
    - **Chỉ chạy lệnh tĩnh duy nhất**:
      ```bash
      node scripts/verify-ui-rules.cjs
      ```
      Nếu có thêm imports/types mới, chạy thêm scoped `pnpm --dir frontend-booking exec tsc --noEmit`.
### 4.6. In-Place Focused Tab Isolation & Zero-Disruptive Redirect Standard

- **Core Invariant: 1 Tab = 1 Autonomous Workspace**:
  - Each tab in Admin or Partner portals serves a dedicated domain workflow.
  - **STRICTLY FORBIDDEN**: Buttons or actions (edit, create, configure, save, cancel) triggering cross-tab or cross-page redirects (e.g. editing a room redirecting back to inventory list).
  - Disruptive redirects destroy user state: wipes scroll position, active filters, search keywords, and pagination index, causing severe cognitive friction.

- **Banned Anti-Patterns**:
  1. **Action-Button-Redirect**: Table row actions (Edit, Configure, Details) using `<Link>` or `router.push()` to route across pages instead of opening in-place.
  2. **Save-Redirect**: Redirecting to another page upon mutation completion. Must stay in active tab context, update cache in-place (optimistic update/refetch), and dismiss overlay smoothly.
  3. **Cancel-Redirect**: Dismiss buttons calling `router.back()` or routing away instead of closing the in-place editor.

- **Approved In-Place Architectural Patterns**:
  1. **Contextual Slide-Over Drawer / Sheet**: Best for medium-to-large forms (room editing, rate policies, booking audit). Slides smoothly from right (`w-full sm:max-w-xl lg:max-w-2xl`), preserving background table, scroll, and filters 100%. Closes on save with toast and in-place refetch.
  2. **Focused In-Place Modal**: For quick dialogs, status toggles, or confirmations (e.g. single-date allotment adjustment).
  3. **Inline Table & Collapsible Row Editing**: For direct cell/row edits (base prices, quota allotments, active switches).
  4. **Master-Detail Split Pane**: Left list (35%), right active editor (65%). Selecting entities switches editor instantly without page navigation.
  5. **Shallow URL Query Sub-State**: Synchronize active entity (`?tab=rooms&edit=room_123`) strictly via shallow params (`window.history.replaceState`), preserving deep links across reloads without route teardown.
  6. **Unsaved Changes Guard**: Prompt in-place confirmation before tab switches or drawer dismissals when form is dirty.

## 5. Progressive extraction

- Page dưới khoảng một workflow có thể giữ layout JSX tại route; tách feature component khi có reuse, độc lập test hoặc page trộn data orchestration với presentation.
- Feature sở hữu types/client/resource/hook/components của mình. `lib/` chỉ chứa primitive dùng chéo feature.
- Không tạo global store cho server state; Zustand chỉ cho client state thực sự shared/persistent.
- Không tạo index barrel toàn feature nếu nó che import cycle hoặc làm Graphify mất seam rõ ràng.


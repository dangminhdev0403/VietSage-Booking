# Aurum Haven — Quiet Luxury Design System & Screen Registry

Hệ thống thiết kế chuẩn hóa cho **OTA Booking Platform (`booking-manager`)**, được đồng bộ trực tiếp từ Google Stitch project `7411068166474105979`.

---

## 1. Brand Identity & Visual Language

- **Phong cách**: Quiet Luxury / Warm Editorial Minimalism.
- **Cảm hứng**: Không gian tĩnh mịch, ấm áp, vương giả nhưng tối giản của các resort 5 sao biển đảo và boutique heritage villa (Six Senses, Amanoi, Capella, JW Marriott).
- **Nguyên tắc cốt lõi**:
  - Không lạm dụng hiệu ứng bóng đổ nặng nề hay màu sắc tương phản gắt.
  - Tôn vinh hình ảnh kiến trúc và cảnh quan thông qua tỷ lệ khung hình chuẩn điện ảnh (16:10 / 21:9).
  - Tối ưu hóa trải nghiệm tự phục vụ của khách hàng thượng lưu (Self-Service Traveler Journey).

---

## 2. Token Bảng Màu (Color Tokens)

| Token Key | Giá trị HEX | Mô tả & Ứng dụng |
| :--- | :--- | :--- |
| `primary` | `#725b38` | Sắc vàng đồng trầm ấm (Primary Brand Color) |
| `primary-container` | `#C5A880` | Sắc vàng champagne ánh kim (CTA buttons, highlight borders) |
| `primary-fixed` | `#fedeb2` | Sắc vàng kem sáng nhạt (Soft badge background, active tags) |
| `secondary` | `#0f172a` | Xanh bóng đêm tĩnh lặng (Midnight Slate - Headline text, dark cards) |
| `tertiary` | `#2D4030` | Xanh ngọc lục bảo rừng nhiệt đới (Deep Emerald - Eco tags, badges) |
| `background` / `surface` | `#faf9f6` | Nền giấy mỹ thuật Warm Ivory mềm mại, dịu mắt |
| `surface-container-lowest` | `#ffffff` | Trắng tinh khôi (Card surface, modal dialogs) |
| `surface-container` | `#efeeeb` | Màu ngà xám nhạt (Input fields background, divider panels) |
| `outline` / `outline-variant` | `#d1c5b8` | Viền kim loại mảnh 1px (Whispering borders) |
| `error` | `#ba1a1a` | Đỏ cảnh báo trạng thái hủy/lỗi thanh toán |

---

## 3. Hệ Thống Typography (Typography Standard)

- **Headlines & Displays**: `Playfair Display` (serif, cổ điển, thanh thoát, sang trọng).
- **Body & Controls**: `Plus Jakarta Sans` / `Be Vietnam Pro` (sans-serif hiện đại, nét thoáng, tối ưu hiển thị tiếng Việt có dấu và số liệu đặt phòng).

| Cấp bậc | Phông chữ | Cỡ chữ / Line Height | Trọng số | Áp dụng |
| :--- | :--- | :--- | :--- | :--- |
| `display-lg` | Playfair Display | 56px / 68px | SemiBold (600) | Hero title chính trang chủ |
| `headline-lg` | Playfair Display | 40px / 52px | SemiBold (600) | Tiêu đề tên khu nghỉ dưỡng, thẻ VIP |
| `headline-md` | Playfair Display | 28px / 38px | Medium (500) | Tiêu đề module hạng phòng, thanh toán |
| `body-lg` | Plus Jakarta Sans | 18px / 28px | Regular (400) | Đoạn mô tả trải nghiệm, quyền lợi |
| `body-md` | Plus Jakarta Sans | 15px / 24px | Regular (400) | Chi tiết tiện ích, chính sách lưu trú |
| `body-sm` | Plus Jakarta Sans | 13px / 20px | Regular (400) | Ghi chú hủy phòng, mã đặt, timestamps |
| `label-lg` | Plus Jakarta Sans | 14px / 20px | SemiBold (600) | Nhãn nút bấm CTA, tab trạng thái |
| `label-sm` | Plus Jakarta Sans | 11px / 14px | Medium (500) | Tag hạng sao, huy hiệu villa độc quyền |

---

## 4. Danh Mục Màn Hình & Ánh Xạ Kiến Trúc (Screen Registry & Route Mapping)

Toàn bộ các tệp HTML mẫu đã được kéo về và lưu trữ cục bộ trong thư mục `shared/stitch_booking/`:

| STT | Tệp HTML cục bộ | Stitch Screen ID | Route Next.js tương ứng | Vai trò kiến trúc & Trải nghiệm |
| :---: | :--- | :---: | :---: | :--- |
| **1** | `my_bookings_evoucher.html` | `fbb7cd2b911b4366b39c1232854b5ad1` | `/my-bookings` | Quản lý kỳ nghỉ khách hàng, lọc tab đơn đặt, hiển thị thẻ **E-Voucher VIP** kèm mã QR check-in & hotline Concierge. |
| **2** | `guest_lookup_payment.html` | `39940912337a43eb87e7ca2861618a8a` | `/booking/lookup` | Tra cứu đơn không cần đăng nhập cho khách vãng lai, hiển thị thông tin chuyển khoản ngân hàng động kèm đồng hồ đếm ngược giữ phòng. |
| **3** | `admin_allotments_rates.html` | `809dc299398549ee8d93e20fa7cfb25f` | `/admin/allotments` | Kênh vận hành đối tác/quản trị: Bảng lịch lưới 30 ngày (Calendar Grid), theo dõi quota phòng còn lại, tỷ lệ OCC và công tắc Stop-Sell. |
| **4** | `profile_elite_membership.html` | `887e1235d86b49a08f440e53b1f38d5f` | `/profile` | Hồ sơ hội viên cá nhân, thẻ kim loại **Aurum Elite Club Card**, quản lý Fast Check-in ID, đổi mật khẩu và ví ưu đãi. |
| **5** | `property_detail.html` | `9cc3128fc19d473c9c54ffb87f468de5` | `/properties/[id]` | Chi tiết khu nghỉ dưỡng: Bộ sưu tập ảnh 16:10, thông số tiện nghi, bảng so sánh hạng phòng, chính sách nhận/trả phòng. |
| **6** | `checkout_payment.html` | `f72b196055644c528aa3d910e90659da` | `/checkout` | Trang thanh toán tập trung: Chọn phương thức (Chuyển khoản / Thẻ quốc tế / Tại quầy), tóm tắt chi phí thuế phí và thông tin khách lưu trú. |
| **7** | `auth_login_register.html` | `c4bbfafe51274cd8bdae6a21b7bb9a50` | `/login` (Modal) | Modal & trang đăng nhập/đăng ký tích hợp, hỗ trợ chuyển đổi mượt mà giữa Traveler và Partner. |
| **8** | `search_results.html` | `321db1ae8fd44203b92aa1224022060a` | `/search` | Trang kết quả tìm kiếm với bộ lọc nâng cao (khoảng giá, số sao, vị trí). |
| **9** | `home_search.html` | `6003d17a243e4756b192e490639d407b` | `/` | Trang chủ sang trọng với Hero Search Capsule và Bento Grid điểm đến. |
| **10** | `home_search_mobile.html` | `766a421579b44cfa900a64a08951f8ef` | `/` (Mobile) | Bản thiết kế giao diện di động tối ưu cho trang chủ. |
| **11** | `search_results_mobile.html` | `87200d5a350b4d97bae409bdc672f15c` | `/search` (Mobile) | Bản thiết kế giao diện di động cho kết quả tìm kiếm. |
| **12** | `checkout_mobile.html` | `74596c5d68514dc69e568c478c770f9e` | `/checkout` (Mobile) | Bản thiết kế giao diện di động cho bước thanh toán. |

---

## 5. Nguyên Tắc Tích Hợp Frontend Next.js

1. **Không Clone Mù Quáng (No Blind Copy-Paste)**:
   - Các tệp HTML Stitch cung cấp cấu trúc layout, class Tailwind CSS và cấu trúc trực quan mẫu.
   - Khi chuyển đổi sang Next.js App Router, phải tái cấu trúc thành các **Server Components** sạch sẽ kết hợp **Client Components** tương tác.
   - Giữ nguyên kiến trúc `@dangminhdev04032005/query-resource` và Zustand store theo đúng quy định trong `AGENTS.md` và `Architecture/RULES.md`.
2. **Authoritative Server Pricing & State**:
   - Mọi mức giá và tính toán chiết khấu phải được fetch từ Backend NestJS (`/api/v1/bookings/calculate-price` hoặc `/api/v1/catalog`), không tính nhẩm ở client.
3. **Thanh Toán Chuyển Khoản Tiêu Chuẩn**:
   - Sử dụng cú pháp chuyển khoản tự động chứa `booking_code` để phục vụ xác nhận tự động hoặc thủ công.

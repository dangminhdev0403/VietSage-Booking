import type { Metadata } from 'next';
import { Be_Vietnam_Pro, Playfair_Display } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/lib/query/query-provider';
import { AuthSessionProvider } from '@/providers/auth-session-provider';
import { UserMenu } from '@/features/auth/components/user-menu';
import Link from 'next/link';
import { Compass, CalendarCheck } from 'lucide-react';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-be-vietnam',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VietSageBooking • Đặt Phòng Khách Sạn & Biệt Thự Nghỉ Dưỡng Trực Tuyến',
  description: 'Nền tảng đặt phòng trực tuyến VietSageBooking kết nối du khách với các khu resort, khách sạn boutique và biệt thự nghỉ dưỡng cao cấp hàng đầu Việt Nam.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`h-full antialiased scroll-smooth ${beVietnamPro.variable} ${playfair.variable}`}>
      <body className="min-h-full flex flex-col bg-background text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container">
        <AuthSessionProvider>
          <QueryProvider>
            {/* Header Navigation (VietSageBooking OTA Clean Public Nav) */}
            <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_2px_16px_rgba(197,168,128,0.08)]">
              <div className="w-full max-w-[1360px] mx-auto px-6 lg:px-10">
                <div className="h-20 flex items-center justify-between gap-6">
                  {/* Brand Logo: VietSageBooking */}
                  <Link href="/" className="flex items-center gap-3.5 group shrink-0">
                    <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center text-on-primary shadow-sm group-hover:bg-primary-container group-hover:text-on-primary-container transition-all">
                      <Compass className="w-6 h-6 text-amber-200" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-black text-on-surface tracking-tight leading-tight group-hover:text-primary transition-colors">
                        VietSage<span className="text-primary font-bold">Booking</span>
                      </span>
                      <span className="text-xs tracking-wider text-outline font-semibold">
                        Đặt Phòng & Nghỉ Dưỡng Trực Tuyến
                      </span>
                    </div>
                  </Link>

                  {/* Public Navigation Links */}
                  <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
                    <Link
                      href="/"
                      className="px-4 py-2 text-sm font-bold rounded-xl bg-primary-container/25 text-on-primary-container whitespace-nowrap"
                    >
                      Trang chủ
                    </Link>
                    <Link
                      href="/#destinations"
                      className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all rounded-xl whitespace-nowrap"
                    >
                      Điểm đến Tinh hoa
                    </Link>
                    <Link
                      href="/#catalog-stream"
                      className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all rounded-xl whitespace-nowrap"
                    >
                      Bộ sưu tập Phòng
                    </Link>
                    <Link
                      href="/#services"
                      className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all rounded-xl whitespace-nowrap"
                    >
                      Đặc quyền & Dịch vụ
                    </Link>
                  </nav>

                  {/* Right Public Actions (User Menu + Primary CTA) */}
                  <div className="flex items-center gap-3 shrink-0">
                    <UserMenu />
                    <Link
                      href="/#destinations"
                      className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-all text-sm font-extrabold shadow-sm whitespace-nowrap cursor-pointer"
                    >
                      <CalendarCheck className="w-4 h-4" />
                      <span>Đặt Kỳ Nghỉ Ngay</span>
                    </Link>
                  </div>
                </div>
              </div>
            </header>

            <main className="flex-1">{children}</main>

            {/* Clean Public Footer */}
            <footer className="bg-surface-container-low border-t border-outline-variant/30 mt-20 py-14">
              <div className="max-w-[1360px] mx-auto px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-on-surface-variant">
                <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
                  <span className="text-lg font-black text-on-surface">
                    VietSage<span className="text-primary">Booking</span>
                  </span>
                  <span className="hidden sm:inline text-outline">•</span>
                  <span>
                    Nền tảng Đặt phòng Trực tuyến & Trải nghiệm Du lịch Nghỉ dưỡng Cao cấp
                  </span>
                </div>
                <div className="flex items-center gap-6 text-xs uppercase tracking-wider text-outline font-bold whitespace-nowrap">
                  <span>Cam kết giá tốt</span>
                  <span>Hỗ trợ 24/7</span>
                  <span>Xác nhận tức thì</span>
                  <span className="text-outline-variant">•</span>
                  <Link href="/admin" className="hover:text-primary transition-colors text-[11px] font-medium lowercase">
                    portal đối tác
                  </Link>
                </div>
              </div>
            </footer>
          </QueryProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}

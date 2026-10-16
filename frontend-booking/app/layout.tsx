import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/lib/query/query-provider';
import Link from 'next/link';
import { Sparkles, Phone, ShieldCheck, Star } from 'lucide-react';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-be-vietnam',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Aurum Haven • Hệ Thống Đặt Phòng Nghỉ Dưỡng Thượng Lưu | VietSage OTA',
  description: 'Nền tảng đặt phòng trực tuyến và biệt thự nghỉ dưỡng cao cấp phong cách Quiet Luxury, đồng bộ theo thời gian thực với VietSage PMS.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`h-full antialiased scroll-smooth ${beVietnamPro.variable}`}>
      <body className="min-h-full flex flex-col bg-background text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container">
        <QueryProvider>
          {/* Header Navigation */}
          <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_2px_16px_rgba(197,168,128,0.08)]">
            <div className="w-full max-w-[1360px] mx-auto px-6 lg:px-10">
              <div className="h-20 flex items-center justify-between gap-6">
                {/* Brand Logo */}
                <Link href="/" className="flex items-center gap-3.5 group shrink-0">
                  <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center text-on-primary shadow-sm group-hover:bg-primary-container group-hover:text-on-primary-container transition-all">
                    <Sparkles className="w-6 h-6 text-amber-200" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-on-surface tracking-tight leading-tight group-hover:text-primary transition-colors">
                      Aurum Haven
                    </span>
                    <span className="text-xs tracking-wider text-primary font-semibold">
                      Resort & Luxury Stays • VietSage OTA
                    </span>
                  </div>
                </Link>

                {/* Navigation Links - clean whitespace-nowrap, larger text */}
                <nav className="hidden lg:flex items-center gap-2">
                  <Link
                    href="/"
                    className="px-4 py-2 text-sm font-semibold rounded-xl bg-primary-container/25 text-on-primary-container whitespace-nowrap"
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
                    href="/#services"
                    className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all rounded-xl whitespace-nowrap"
                  >
                    Đặc quyền & Dịch vụ
                  </Link>
                  <Link
                    href="/admin"
                    className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all rounded-xl whitespace-nowrap"
                  >
                    Kênh Quản trị Đối tác
                  </Link>
                </nav>

                {/* Right Utilities */}
                <div className="flex items-center gap-4 shrink-0">
                  {/* Concierge Hotline */}
                  <div className="hidden xl:flex items-center gap-2.5 bg-surface-container-lowest px-4 py-2 rounded-full border border-outline-variant/30 shadow-sm">
                    <Phone className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-outline font-bold">Concierge 24/7</span>
                      <a href="tel:+84288888LUXE" className="text-sm font-bold text-on-surface hover:text-primary tracking-tight whitespace-nowrap">
                        +84 28 8888 LUXE
                      </a>
                    </div>
                  </div>

                  {/* VIP Member Badge */}
                  <div className="hidden sm:flex items-center gap-2.5 pl-1">
                    <div className="relative flex items-center">
                      <div className="w-9 h-9 rounded-full bg-primary-container/40 border border-primary text-primary flex items-center justify-center font-bold text-xs">
                        VIP
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary-container rounded-full flex items-center justify-center ring-2 ring-surface">
                        <Star className="w-2.5 h-2.5 text-on-primary-container fill-on-primary-container" />
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-on-surface font-bold leading-tight">Quý khách VIP</span>
                      <span className="text-xs text-primary font-semibold">Hoàng Kim (Gold Member)</span>
                    </div>
                  </div>

                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-all text-xs sm:text-sm font-bold shadow-sm whitespace-nowrap"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Đối tác PMS</span>
                  </Link>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          {/* Footer */}
          <footer className="bg-surface-container-low border-t border-outline-variant/30 mt-20 py-14">
            <div className="max-w-[1360px] mx-auto px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-on-surface-variant">
              <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
                <span className="text-lg font-bold text-on-surface">Aurum Haven</span>
                <span className="hidden sm:inline text-outline">•</span>
                <span>
                  Bản quyền thuộc Hệ thống Đặt phòng Cao cấp VietSage OTA & PMS Ecosystem
                </span>
              </div>
              <div className="flex items-center gap-6 text-xs uppercase tracking-wider text-outline font-bold whitespace-nowrap">
                <span>Forbes 5-Star Selected</span>
                <span>Michelin Key Certified</span>
                <span>Bảo mật 100%</span>
              </div>
            </div>
          </footer>
        </QueryProvider>
      </body>
    </html>
  );
}

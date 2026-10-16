import type { Metadata } from 'next';
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/lib/query/query-provider';
import Link from 'next/link';
import { Sparkles, Phone, ShieldCheck, Star } from 'lucide-react';

const playfair = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-playfair',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-plus-jakarta',
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
    <html lang="vi" className={`h-full antialiased scroll-smooth ${playfair.variable} ${plusJakarta.variable}`}>
      <body className="min-h-full flex flex-col bg-background text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container">
        <QueryProvider>
          {/* Sticky Top Navigation Header (Inherited from Stitch 7411068166474105979) */}
          <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_2px_16px_rgba(197,168,128,0.08)]">
            <div className="w-full max-w-[1320px] mx-auto px-6 lg:px-12">
              <div className="h-20 flex items-center justify-between gap-6">
                {/* Brand Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm group-hover:bg-primary-container group-hover:text-on-primary-container transition-all">
                    <Sparkles className="w-5 h-5 text-amber-200" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-serif text-xl font-bold text-on-surface tracking-wide leading-tight group-hover:text-primary transition-colors">
                      Aurum Haven
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-primary font-semibold">
                      Resort & Luxury Stays • VietSage OTA
                    </span>
                  </div>
                </Link>

                {/* Navigation Links */}
                <nav className="hidden lg:flex items-center gap-1">
                  <Link
                    href="/"
                    className="px-4 py-2 text-xs uppercase tracking-wider font-semibold rounded-lg bg-primary-container/20 text-on-primary-container"
                  >
                    Trang chủ
                  </Link>
                  <Link
                    href="/#destinations"
                    className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all rounded-lg"
                  >
                    Điểm đến Tinh hoa
                  </Link>
                  <Link
                    href="/#services"
                    className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all rounded-lg"
                  >
                    Đặc quyền & Dịch vụ
                  </Link>
                  <Link
                    href="/admin"
                    className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all rounded-lg"
                  >
                    Kênh Quản Trị Đối Tác
                  </Link>
                </nav>

                {/* Right Utilities */}
                <div className="flex items-center gap-4">
                  {/* Concierge Hotline */}
                  <div className="hidden xl:flex items-center gap-2 bg-surface-container-lowest/90 px-3.5 py-1.5 rounded-full border border-outline-variant/30 shadow-sm">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-wider text-outline font-semibold">Concierge 24/7</span>
                      <a href="tel:+84288888LUXE" className="text-xs font-bold text-on-surface hover:text-primary tracking-tight">
                        +84 28 8888 LUXE
                      </a>
                    </div>
                  </div>

                  {/* VIP Member Badge */}
                  <div className="flex items-center gap-2 pl-1">
                    <div className="relative flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary-container/40 border border-primary text-primary flex items-center justify-center font-bold text-xs">
                        VIP
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-primary-container rounded-full flex items-center justify-center ring-2 ring-surface">
                        <Star className="w-2 h-2 text-on-primary-container fill-on-primary-container" />
                      </span>
                    </div>
                    <div className="hidden sm:flex flex-col">
                      <span className="text-xs text-on-surface font-semibold">Quý khách VIP</span>
                      <span className="text-[10px] text-primary tracking-wide font-medium">Hoàng Kim (Gold Member)</span>
                    </div>
                  </div>

                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-all text-xs font-semibold shadow-sm tracking-wide"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Đối tác PMS</span>
                  </Link>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          {/* Footer (Aurum Haven Quiet Luxury Style) */}
          <footer className="bg-surface-container-low border-t border-outline-variant/30 mt-20 py-12">
            <div className="max-w-[1320px] mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-on-surface-variant">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <span className="font-serif text-base font-bold text-on-surface">Aurum Haven</span>
                <span className="hidden sm:inline text-outline">•</span>
                <span className="text-center sm:text-left">
                  Bản quyền thuộc Hệ thống Đặt phòng Cao cấp VietSage OTA & PMS Ecosystem
                </span>
              </div>
              <div className="flex items-center gap-6 text-[11px] uppercase tracking-wider text-outline font-semibold">
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

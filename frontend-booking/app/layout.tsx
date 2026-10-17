import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/lib/query/query-provider';
import { AuthSessionProvider } from '@/providers/auth-session-provider';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-be-vietnam',
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
    <html lang="vi" className={`h-full antialiased scroll-smooth ${beVietnamPro.variable}`}>
      <body className="min-h-full flex flex-col bg-background text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container">
        <AuthSessionProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}

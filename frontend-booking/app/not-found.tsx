'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Headphones,
  Bell,
} from 'lucide-react';
import { UserMenu } from '@/features/auth/components/user-menu';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface antialiased flex flex-col justify-between selection:bg-primary-container selection:text-on-primary-container">
      {/* 1. Header */}
      <header className="sticky top-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/20">
        <div className="h-20 max-w-[1320px] mx-auto px-6 lg:px-12 flex items-center justify-between gap-6">
          <Link href="/" className="flex flex-col group">
            <span className="font-sans text-2xl font-black tracking-tight text-primary group-hover:text-primary-container transition-colors">
              VIETSAGE BOOKING
            </span>
            <span className="text-[10px] tracking-widest uppercase text-on-surface-variant font-medium">
              Resort &amp; Luxury Stays
            </span>
          </Link>

          <nav className="hidden xl:flex items-center gap-1">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg text-base text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Trang chủ
            </Link>
            <Link
              href="/#destinations"
              className="px-4 py-2 rounded-lg text-base text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Điểm đến &amp; Khách sạn
            </Link>
            <Link
              href="/#privilege"
              className="px-4 py-2 rounded-lg text-base text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Ưu đãi Đặc quyền
            </Link>
            <Link
              href="/booking/lookup"
              className="px-4 py-2 rounded-lg text-base text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Tra cứu đơn đặt
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/alerts"
              className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-colors relative"
              title="Thông báo hệ thống"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary ring-2 ring-surface" />
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* 2. Main Section */}
      <main className="w-full relative overflow-hidden flex-1">
        {/* Subtle ambient glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[480px] bg-primary-container/10 rounded-full blur-[160px] pointer-events-none -z-10" />

        <section className="relative w-full max-w-[960px] mx-auto px-6 lg:px-12 pt-16 pb-14 lg:pt-24 lg:pb-16 text-center flex flex-col items-center">
          {/* Delicate Status Accent */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-surface-container-low/60 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] tracking-[0.2em] uppercase text-primary font-semibold">
              VietSage Booking • 404 Not Found
            </span>
          </div>

          {/* Typographic 404 */}
          <div className="select-none mb-2">
            <span className="font-sans italic text-[96px] sm:text-[132px] lg:text-[160px] leading-none font-bold text-primary/25 tracking-tight">
              404
            </span>
          </div>

          {/* Centered Editorial Headline */}
          <h1 className="font-sans text-[32px] sm:text-[44px] lg:text-[50px] leading-[1.25] text-on-surface font-extrabold tracking-tight max-w-3xl">
            Trang Này Tạm Thời <br className="hidden sm:inline" />
            <span className="italic text-primary font-sans">Không Tìm Thấy</span>
          </h1>

          {/* Subtext */}
          <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed max-w-xl mt-6 font-light">
            Đường dẫn quý khách truy cập có thể đã được cập nhật hoặc không còn khả dụng. Hãy để chúng tôi đồng hành đưa quý khách trở lại trải nghiệm tìm kiếm kỳ nghỉ tuyệt vời.
          </p>

          {/* Minimalist Dual Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-lg bg-primary text-on-primary text-xs uppercase tracking-wider font-bold shadow-sm hover:bg-primary/90 transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về Trang Chủ VietSage Booking</span>
            </Link>

            <a
              href="tel:19006868"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg border border-outline-variant/60 text-on-surface text-xs uppercase tracking-wider font-bold hover:border-primary hover:text-primary hover:bg-surface-container-low transition-all duration-300"
            >
              <Headphones className="w-4 h-4 text-primary" />
              <span>Liên Hệ Hỗ Trợ 24/7</span>
            </a>
          </div>

          {/* Direct Hotline */}
          <div className="mt-8 flex items-center gap-2 text-on-surface-variant text-xs">
            <span className="font-sans italic text-primary font-medium">Tổng đài hỗ trợ 24/7:</span>
            <a
              href="tel:19006868"
              className="hover:text-primary transition-colors tracking-wider font-medium"
            >
              1900 6868
            </a>
          </div>
        </section>

        {/* Serene Photo Card */}
        <section className="w-full max-w-[1200px] mx-auto px-6 lg:px-12 pb-20">
          <div className="relative w-full h-[360px] sm:h-[460px] lg:h-[520px] rounded-3xl overflow-hidden shadow-lg border border-outline-variant/20">
            <img
              src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=80"
              alt="Breathtaking luxury tropical oceanfront resort at golden sunset with infinity pool"
              className="w-full h-full object-cover transition-transform duration-1000 ease-out hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/30" />

            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="text-center text-white space-y-3 max-w-lg backdrop-blur-sm bg-black/25 p-6 sm:p-8 rounded-2xl border border-white/15">
                <span className="text-[11px] uppercase tracking-widest text-slate-300 block">
                  Trang 404 - Không tìm thấy trang - VietSage Booking
                </span>
                <span className="font-sans italic text-5xl sm:text-6xl text-white/90 block leading-none font-bold">
                  404
                </span>
                <h2 className="font-sans text-lg sm:text-xl font-bold uppercase tracking-wider text-amber-200">
                  Rất tiếc, trang này không tồn tại
                </h2>
                <p className="text-xs sm:text-base text-slate-200 leading-relaxed max-w-sm mx-auto">
                  Chúng tôi không thể tìm thấy trang bạn đang tìm kiếm. Vui lòng quay lại trang chủ hoặc tra cứu đơn đặt phòng của quý khách.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <Link
                    href="/"
                    className="inline-block px-6 py-2.5 rounded-full bg-primary/90 hover:bg-primary text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md"
                  >
                    Quay Về Trang Chủ
                  </Link>
                  <Link
                    href="/booking/lookup"
                    className="inline-block px-6 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold uppercase tracking-wider transition-all backdrop-blur-xs"
                  >
                    Tra Cứu Đơn
                  </Link>
                </div>
              </div>
            </div>

            <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8 text-white/90 pointer-events-none">
              <p className="text-[11px] uppercase tracking-widest text-primary-fixed font-bold">
                VietSage Luxury Stays
              </p>
              <p className="font-sans italic text-lg sm:text-xl font-light text-white mt-0.5">
                Kỳ nghỉ thượng lưu • Trọn vẹn từng khoảnh khắc
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 3. Footer */}
      <footer className="w-full bg-surface-container-low border-t border-primary/10">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-12 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Col 1 */}
            <div className="flex flex-col gap-3 md:col-span-1">
              <span className="font-sans text-xl font-bold text-primary">VIETSAGE BOOKING</span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Nền tảng đặt phòng trực tuyến kết nối các khách sạn và resort cao cấp hàng đầu Việt Nam.
              </p>
            </div>

            {/* Col 2 */}
            <div className="flex flex-col gap-3">
              <span className="text-xs uppercase tracking-wider text-on-surface font-semibold">
                Khám phá
              </span>
              <Link
                href="/#destinations"
                className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Bộ sưu tập Khách sạn
              </Link>
              <Link
                href="/booking/lookup"
                className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Tra cứu đơn đặt
              </Link>
              <Link
                href="/#privilege"
                className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Đặc quyền Hội viên
              </Link>
            </div>

            {/* Col 3 */}
            <div className="flex flex-col gap-3">
              <span className="text-xs uppercase tracking-wider text-on-surface font-semibold">
                Trung tâm hỗ trợ
              </span>
              <p className="text-xs text-on-surface-variant">hotro@vietsage.com</p>
              <p className="text-xs text-on-surface-variant">Hotline: 1900 6868</p>
              <span className="text-[11px] text-on-surface-variant">
                Hỗ trợ đặt phòng &amp; thanh toán 24/7
              </span>
            </div>

            {/* Col 4 */}
            <div className="flex flex-col gap-3">
              <span className="text-xs uppercase tracking-wider text-on-surface font-semibold">
                Tiêu chuẩn dịch vụ
              </span>
              <p className="text-xs text-on-surface-variant">
                Cam kết giá minh bạch, xác nhận tức thì và hỗ trợ khách hàng chu đáo trên mọi hành trình lưu trú.
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-outline-variant/20">
            <p className="text-xs text-on-surface-variant">
              © 2026 VietSage Booking OTA Platform. Bản quyền đã được bảo hộ.
            </p>
            <div className="flex items-center gap-6 text-xs text-on-surface-variant">
              <Link href="#" className="hover:text-on-surface transition-colors">
                Chính sách Bảo mật
              </Link>
              <Link href="#" className="hover:text-on-surface transition-colors">
                Điều khoản Dịch vụ
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

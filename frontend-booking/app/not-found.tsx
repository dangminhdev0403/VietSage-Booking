'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Headphones,
  Bell,
} from 'lucide-react';
import { UserMenu } from '@/features/auth/components/user-menu';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface antialiased flex flex-col justify-between selection:bg-primary-container selection:text-on-primary-container">
      {/* 1. Header */}
      <header className="sticky top-0 w-full z-50 bg-surface/95 backdrop-blur-md border-b border-outline-variant/30">
        <div className="h-18 max-w-[1320px] mx-auto px-6 lg:px-12 flex items-center justify-between gap-6">
          <Link href="/" className="flex flex-col group">
            <span className="font-sans text-xl sm:text-2xl font-black tracking-tight text-primary group-hover:text-primary-container transition-colors">
              VIETSAGE BOOKING
            </span>
            <span className="text-xs uppercase tracking-wider text-on-surface-variant font-medium">
              Nền Tảng Đặt Phòng Trực Tuyến
            </span>
          </Link>

          <nav className="hidden xl:flex items-center gap-1">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Trang chủ
            </Link>
            <Link
              href="/#destinations"
              className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Điểm đến
            </Link>
            <Link
              href="/booking/lookup"
              className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
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

      {/* 2. Main Section - Streamlined High-Signal 404 */}
      <main className="w-full flex-1 flex items-center justify-center py-16 px-6 lg:px-12">
        <section className="w-full max-w-[640px] mx-auto text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/25 bg-surface-container-low mb-6">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs tracking-wider uppercase text-primary font-bold">
              Lỗi 404 • Không Tìm Thấy Trang
            </span>
          </div>

          <div className="select-none mb-3">
            <span className="font-sans text-7xl sm:text-9xl font-black text-primary/20 tracking-tight leading-none">
              404
            </span>
          </div>

          <h1 className="font-sans text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight max-w-lg">
            Trang không tồn tại hoặc đã thay đổi địa chỉ
          </h1>

          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed max-w-md mt-4">
            Địa chỉ liên kết bạn truy cập hiện không khả dụng. Quý khách vui lòng trở lại trang chủ để tìm kiếm khách sạn hoặc kiểm tra lại thông tin đơn đặt phòng.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-on-primary text-sm font-semibold shadow-sm hover:bg-primary/90 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về Trang Chủ</span>
            </Link>

            <Link
              href="/booking/lookup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-outline-variant text-on-surface text-sm font-semibold hover:border-primary hover:text-primary hover:bg-surface-container-low transition-colors"
            >
              <Search className="w-4 h-4 text-primary" />
              <span>Tra Cứu Đơn Đặt</span>
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-outline-variant/30 flex items-center gap-2 text-xs text-on-surface-variant">
            <Headphones className="w-4 h-4 text-primary" />
            <span>Hỗ trợ khách hàng 24/7:</span>
            <a
              href="tel:19006868"
              className="font-bold text-primary hover:underline tracking-wide"
            >
              1900 6868
            </a>
          </div>
        </section>
      </main>

      {/* 3. Footer */}
      <footer className="w-full bg-surface-container-low border-t border-outline-variant/30">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-12 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex flex-col gap-2 md:col-span-1">
              <span className="font-sans text-lg font-bold text-primary">VIETSAGE BOOKING</span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Nền tảng đặt phòng trực tuyến kết nối các khách sạn và resort cao cấp hàng đầu Việt Nam.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="text-xs uppercase tracking-wider text-on-surface font-bold">
                Khám phá
              </span>
              <Link
                href="/#destinations"
                className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Danh mục khách sạn
              </Link>
              <Link
                href="/booking/lookup"
                className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Tra cứu đơn đặt
              </Link>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="text-xs uppercase tracking-wider text-on-surface font-bold">
                Hỗ trợ
              </span>
              <p className="text-xs text-on-surface-variant">hotro@vietsage.com</p>
              <p className="text-xs text-on-surface-variant">Hotline: 1900 6868 (24/7)</p>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="text-xs uppercase tracking-wider text-on-surface font-bold">
                Tiêu chuẩn dịch vụ
              </span>
              <p className="text-xs text-on-surface-variant">
                Cam kết giá minh bạch, xác nhận tức thì và hỗ trợ khách hàng chu đáo trên mọi hành trình lưu trú.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-outline-variant/20 text-xs text-on-surface-variant">
            <p>© 2026 VietSage Booking OTA Platform. Bản quyền đã được bảo hộ.</p>
            <div className="flex items-center gap-6">
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

'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, CalendarCheck } from 'lucide-react';
import { UserMenu } from '@/features/auth/components/user-menu';

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_2px_16px_rgba(197,168,128,0.08)]">
      <div className="w-full max-w-[1360px] mx-auto px-6 lg:px-10">
        <div className="h-20 flex items-center justify-between gap-6">
          {/* Brand Logo: VietSageBooking */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3.5 group shrink-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-primary flex items-center justify-center text-on-primary shadow-sm group-hover:bg-primary-container group-hover:text-on-primary-container transition-all">
              <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-amber-200" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black text-on-surface tracking-tight leading-tight group-hover:text-primary transition-colors">
                VietSage<span className="text-primary font-bold">Booking</span>
              </span>
              <span className="hidden sm:block text-xs tracking-wider text-outline font-semibold">
                Đặt Phòng &amp; Nghỉ Dưỡng Trực Tuyến
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
          </nav>

          {/* Right Public Actions (User Menu + Primary CTA) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <UserMenu />
            <Link
              href="/#destinations"
              className="hidden sm:inline-flex items-center gap-2 h-11 px-6 rounded-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-all text-sm font-extrabold shadow-sm whitespace-nowrap cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Đặt Kỳ Nghỉ Ngay</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

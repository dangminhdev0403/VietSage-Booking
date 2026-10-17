'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Headphones,
  Search,
  Calendar,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { luxuryAlert } from '@/lib/alert/luxury-alert';

interface AdminShellProps {
  children: React.ReactNode;
  sessionUser?: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

function getFormattedVietnamDate(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  };
  return new Intl.DateTimeFormat('vi-VN', options).format(now);
}

export function AdminShell({ children, sessionUser }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [selectedResort, setSelectedResort] = useState('all');
  const currentDateFormatted = getFormattedVietnamDate();

  const navItems = [
    {
      label: 'Tổng quan & Đặt phòng',
      sublabel: 'Dashboard & Bookings',
      href: '/admin',
      icon: LayoutDashboard,
      active: pathname === '/admin',
    },
    {
      label: 'Lịch Giá & Tồn Kho',
      sublabel: 'Allotments & Yield',
      href: '/admin/allotments',
      icon: CalendarDays,
      active: pathname === '/admin/allotments',
    },
    {
      label: 'Quản lý Buồng phòng & Khách sạn',
      sublabel: 'Housekeeping & Villas',
      href: '/admin/properties',
      icon: Building2,
      active: pathname === '/admin/properties',
    },
  ];

  const role = sessionUser?.role || 'ADMIN';
  const displayName = sessionUser?.name || 'Tổng Quản Lý';
  const displayEmail = sessionUser?.email || 'admin@vietsage.com';

  const handleNotificationClick = () => {
    luxuryAlert.info({
      title: 'Thông Báo Điều Hành',
      message: 'Hiện có 3 lượt khách VIP dự kiến nhận phòng trong 2 giờ tới và 1 yêu cầu phục vụ trà chiều tại Sunset Villa 01.',
    });
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col antialiased">
      {/* SIDEBAR - DESKTOP */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 bg-surface-container-low border-r border-outline-variant/30 z-50 flex-col justify-between py-6 px-5 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col gap-6">
          {/* Brand Header */}
          <div className="flex flex-col gap-1.5 px-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl border border-primary/40 bg-primary/10 flex items-center justify-center text-primary font-serif font-black text-sm tracking-wider shadow-xs">
                AH
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary block leading-none">
                  AURUM HAVEN
                </span>
                <span className="text-sm font-bold text-on-surface tracking-tight block mt-0.5">
                  Management Portal
                </span>
              </div>
            </div>
            <p className="text-[11px] text-outline mt-1 font-medium leading-tight">
              Hệ thống Quản trị Nghỉ dưỡng Cao cấp
            </p>
          </div>

          {/* Live Distribution Status Badge */}
          <div className="px-3.5 py-2.5 rounded-2xl bg-surface-container border border-outline-variant/30 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-on-surface font-semibold">Hệ thống phân phối LIVE</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-container/30 text-on-primary-container font-extrabold uppercase">
              v3.4
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1.5 mt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all ${
                    item.active
                      ? 'bg-primary-container text-on-primary-container font-bold shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-medium'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${item.active ? 'text-on-primary-container' : 'text-primary'}`} />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold leading-tight">{item.label}</span>
                    <span className={`text-[10px] leading-tight mt-0.5 ${item.active ? 'text-on-primary-container/80' : 'text-outline'}`}>
                      {item.sublabel}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Privilege Support Card & Back to OTA */}
        <div className="space-y-3">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-bold text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span>Về Cổng Khách Hàng OTA</span>
          </Link>

          <div className="p-3.5 bg-surface-container rounded-2xl border border-outline-variant/30 flex items-center justify-between shadow-2xs">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-outline tracking-wider">Hỗ trợ đặc quyền</span>
              <span className="text-xs font-bold text-on-surface mt-0.5">Hotline GM: (+84) 901 888</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary-container/20 text-primary flex items-center justify-center">
              <Headphones className="w-4 h-4" />
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-surface-container-low h-full flex flex-col justify-between py-6 px-5 border-r border-outline-variant/40 shadow-xl z-50">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                    AH
                  </div>
                  <span className="font-bold text-sm text-on-surface">Aurum Haven</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-full hover:bg-surface-container text-outline"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                        item.active
                          ? 'bg-primary-container text-on-primary-container shadow-xs'
                          : 'text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-outline-variant/30 space-y-3">
              <Link
                href="/"
                className="block text-center text-xs font-bold text-outline hover:text-on-surface"
              >
                Về Cổng Khách Hàng OTA
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TOP HEADER - STICKY */}
      <header className="fixed top-0 left-0 lg:left-72 right-0 h-20 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 z-40 flex items-center justify-between px-4 sm:px-6 lg:px-10 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        {/* Left Section: Mobile Toggle & Quick Search */}
        <div className="flex items-center gap-3 sm:gap-6 flex-1 max-w-xl">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative flex items-center w-full max-w-xs sm:max-w-sm bg-surface-container-low rounded-xl px-3.5 py-2 border border-outline-variant/30 focus-within:border-primary/50 transition-colors">
            <Search className="w-4 h-4 text-outline mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Tìm đặt phòng, khách hàng, mã suite..."
              className="bg-transparent text-xs text-on-surface placeholder:text-outline/70 focus:outline-hidden w-full font-medium"
            />
          </div>

          {/* Operational Date Indicator (Hidden on small screens) */}
          <div className="hidden xl:flex items-center gap-2 bg-surface-container-low px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-medium text-on-surface shrink-0">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="capitalize">{currentDateFormatted || 'Hôm nay'}</span>
          </div>
        </div>

        {/* Right Section: Resort Selector, Notifications, User Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Resort Switcher */}
          <div className="hidden sm:flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/30 text-on-surface">
            <Building2 className="w-4 h-4 text-primary shrink-0" />
            <select
              value={selectedResort}
              onChange={(e) => setSelectedResort(e.target.value)}
              className="bg-transparent text-xs font-bold text-on-surface focus:outline-hidden cursor-pointer pr-1"
            >
              <option value="all">Toàn hệ thống Aurum</option>
              <option value="phu-quoc">Aurum Sunset Phú Quốc</option>
              <option value="mui-ne">Resort Mũi Né Haven</option>
              <option value="son-tra">Villa Sơn Trà Heritage</option>
            </select>
          </div>

          {/* Notifications Button */}
          <button
            type="button"
            onClick={handleNotificationClick}
            className="relative p-2.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            title="Xem thông báo điều hành"
          >
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </button>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-black shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden md:block">
                <span className="text-xs font-bold text-on-surface block leading-tight line-clamp-1 max-w-[110px]">
                  {displayName}
                </span>
                <span className="text-[10px] text-outline font-medium block leading-tight">
                  {role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-outline" />
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3 border-b border-outline-variant/20 mb-2">
                  <div className="font-bold text-sm text-on-surface">{displayName}</div>
                  <div className="text-xs text-outline truncate mt-0.5">{displayEmail}</div>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-container/20 text-primary text-[10px] font-extrabold uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{role} Scope</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Link
                    href="/admin"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-surface-container text-xs font-bold text-on-surface transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-primary" />
                    <span>Bảng Tổng Quan</span>
                  </Link>
                  <Link
                    href="/admin/allotments"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-surface-container text-xs font-bold text-on-surface transition-colors"
                  >
                    <CalendarDays className="w-4 h-4 text-emerald-600" />
                    <span>Lịch Tồn Kho & Giá Phòng</span>
                  </Link>
                  <Link
                    href="/admin/properties"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-surface-container text-xs font-bold text-on-surface transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-primary" />
                    <span>Quản lý Buồng phòng & Khách sạn</span>
                  </Link>

                  <div className="h-px bg-outline-variant/20 my-1" />

                  <button
                    onClick={async () => {
                      setUserDropdownOpen(false);
                      await signOut({ callbackUrl: '/' });
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-rose-50 text-xs font-bold text-rose-600 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="lg:pl-72 pt-20 flex-1 flex flex-col min-w-0">
        <main className="flex-1 w-full">{children}</main>

        {/* Dedicated Admin Operational Footer */}
        <footer className="mt-auto border-t border-outline-variant/20 py-4 px-6 lg:px-10 text-xs text-outline flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-container-low/50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-on-surface">Aurum Haven Management Portal</span>
            <span className="text-outline-variant">•</span>
            <span>Hệ thống điều hành OTA v3.4</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Múi giờ chuẩn: Asia/Ho_Chi_Minh (UTC+7)</span>
            <span className="text-outline-variant">•</span>
            <Link href="/" className="text-primary hover:underline font-semibold">
              Về Cổng Khách Hàng OTA
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

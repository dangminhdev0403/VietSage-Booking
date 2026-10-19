'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Calendar,
  CreditCard,
  Building2,
  CalendarDays,
  Headphones,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Hotel,
  BedDouble,
} from 'lucide-react';
import { luxuryAlert } from '@/lib/alert/luxury-alert';
import { VietSageLogo } from '@/components/shared/vietsage-logo';

interface AdminShellProps {
  children: React.ReactNode;
  isPartner?: boolean;
  sessionUser?: {
    name?: string | null;
    email?: string | null;
    role?: string;
    managedPropertyId?: string | null;
    accessibleProperties?: Array<{ id: string; name: string }>;
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

export function AdminShell({ children, sessionUser, isPartner: isPartnerProp }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const currentDateFormatted = getFormattedVietnamDate();

  const isPartner =
    isPartnerProp !== undefined
      ? isPartnerProp
      : Boolean(sessionUser?.managedPropertyId || sessionUser?.role === 'HOTEL_PARTNER' || pathname.startsWith('/partner'));

  const navItems = isPartner
    ? [
        {
          label: 'Tổng quan',
          href: '/partner',
          icon: LayoutDashboard,
          active: pathname === '/partner',
        },
        {
          label: 'Quản lý Đơn đặt phòng',
          href: '/partner/bookings',
          icon: Calendar,
          active: pathname.startsWith('/partner/bookings'),
        },
        {
          label: 'Quản lý Phòng',
          href: '/partner/rooms',
          icon: BedDouble,
          active: pathname.startsWith('/partner/rooms'),
        },
        {
          label: 'Lịch phòng & Giá bán',
          href: '/partner/allotments',
          icon: CalendarDays,
          active: pathname.startsWith('/partner/allotments'),
        },
        {
          label: 'Doanh thu & Thanh toán',
          href: '/partner/payments',
          icon: CreditCard,
          active: pathname.startsWith('/partner/payments'),
        },
        {
          label: 'Quản lý Khách sạn',
          href: '/partner/properties',
          icon: Building2,
          active:
            pathname.startsWith('/partner/properties') ||
            pathname.startsWith('/partner/property'),
        },
      ]
    : [
        {
          label: 'Tổng quan',
          href: '/admin',
          icon: LayoutDashboard,
          active: pathname === '/admin',
        },
        {
          label: 'Quản lý Đơn đặt phòng',
          href: '/admin/bookings',
          icon: Calendar,
          active: pathname.startsWith('/admin/bookings'),
        },
        {
          label: 'Quản lý Khách sạn',
          href: '/admin/properties',
          icon: Building2,
          active: pathname.startsWith('/admin/properties'),
        },
        {
          label: 'Quản lý Phòng',
          href: '/partner/rooms',
          icon: BedDouble,
          active: pathname.startsWith('/partner/rooms'),
        },
        {
          label: 'Lịch phòng & Giá bán',
          href: '/admin/allotments',
          icon: CalendarDays,
          active: pathname.startsWith('/admin/allotments'),
        },
        {
          label: 'Doanh thu & Thanh toán',
          href: '/admin/payments',
          icon: CreditCard,
          active: pathname.startsWith('/admin/payments'),
        },
      ];

  const role = sessionUser?.role || 'ADMIN';
  const displayName = sessionUser?.name || 'Tổng Quản Lý';
  const displayEmail = sessionUser?.email || 'admin@vietsage.com';
  const managedPropertyId = sessionUser?.managedPropertyId;

  const managedPropertyName = managedPropertyId
    ? sessionUser?.accessibleProperties?.find((p) => p.id === managedPropertyId)?.name || 'Cơ sở lưu trú'
    : null;

  const scopeBadgeLabel = isPartner
    ? managedPropertyName
      ? `Khách sạn: ${managedPropertyName}`
      : 'Khách sạn đối tác'
    : 'Kênh Quản Trị OTA & PMS';

  const portalTitle = isPartner ? 'Quản Trị Khách Sạn' : 'Kênh Quản Trị OTA';
  const portalSubtitle = isPartner ? 'Vận hành phòng & Đơn đặt' : 'Đồng bộ VietSage PMS';

  const activeNavItemClass = isPartner
    ? 'bg-emerald-50 text-emerald-800 font-bold border-emerald-200/90 shadow-2xs'
    : 'bg-primary/10 text-primary font-bold border-primary/25 shadow-2xs';

  const activeIndicatorClass = isPartner ? 'bg-emerald-700' : 'bg-primary';
  const activeIconClass = isPartner ? 'text-emerald-700' : 'text-primary';

  const handleNotificationClick = () => {
    luxuryAlert.info({
      title: 'Trạng Thái Hệ Thống',
      message: 'Hệ thống vận hành OTA kết nối trực tiếp với máy chủ. Tất cả giao dịch và dịch vụ đang hoạt động ổn định.',
    });
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col antialiased">
      {/* SIDEBAR - DESKTOP */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-200/90 z-50 flex-col justify-between py-6 px-5 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col gap-6">
          {/* Brand Header */}
          <div className="flex flex-col gap-1 px-2">
            <div className="flex items-center gap-3">
              <VietSageLogo variant="mark" size="sm" />
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500 block leading-none">
                  VIETSAGE BOOKING
                </span>
                <span className="text-base font-bold text-slate-900 tracking-tight block mt-1">
                  {portalTitle}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium leading-tight">
              {portalSubtitle}
            </p>
          </div>

          {/* Scope Badge (No truncation) */}
          <div
            className={`px-3.5 py-2.5 rounded-2xl border flex items-center gap-2.5 shadow-2xs ${
              isPartner
                ? 'bg-emerald-50/90 border-emerald-200/90'
                : 'bg-primary/10 border-primary/20'
            }`}
          >
            {isPartner ? (
              <Hotel className="w-4.5 h-4.5 text-emerald-700 shrink-0" />
            ) : (
              <ShieldCheck className="w-4.5 h-4.5 text-primary shrink-0" />
            )}
            <span
              className={`text-xs sm:text-sm font-bold whitespace-nowrap ${
                isPartner ? 'text-emerald-950' : 'text-on-surface'
              }`}
              title={scopeBadgeLabel}
            >
              {scopeBadgeLabel}
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
                  scroll={false}
                  className={`group flex items-center justify-between px-3.5 py-3 rounded-xl border transition-colors duration-150 ${
                    item.active
                      ? activeNavItemClass
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        item.active ? activeIconClass : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span className="text-sm sm:text-base font-bold tracking-tight truncate">
                      {item.label}
                    </span>
                  </div>
                  <span
                    className={`w-1.5 h-4 rounded-full shrink-0 transition-opacity duration-150 ${activeIndicatorClass} ${
                      item.active ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Action: Back to OTA */}
        <div>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-outline-variant/30 text-xs sm:text-sm font-bold text-stone-600 hover:text-stone-900 hover:bg-surface-container transition-colors"
          >
            <span>Kênh Khách Đặt Phòng (OTA)</span>
          </Link>
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
                <div className="flex items-center gap-2.5">
                  <VietSageLogo variant="mark" size="sm" />
                  <span className="font-bold text-base text-on-surface">VietSage Booking</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-full hover:bg-surface-container text-outline"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scope Badge in Mobile */}
              <div
                className={`px-3.5 py-2 rounded-xl border flex items-center gap-2.5 ${
                  isPartner
                    ? 'bg-emerald-50 border-emerald-200/80 text-emerald-950'
                    : 'bg-primary/10 border-primary/20 text-on-surface'
                }`}
              >
                {isPartner ? (
                  <Hotel className="w-4 h-4 text-emerald-700 shrink-0" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                )}
                <span className="text-xs sm:text-sm font-bold whitespace-nowrap">{scopeBadgeLabel}</span>
              </div>

              <nav className="flex flex-col gap-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      scroll={false}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-colors duration-150 ${
                        item.active
                          ? activeNavItemClass
                          : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${item.active ? activeIconClass : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      <span
                        className={`w-1.5 h-3.5 rounded-full shrink-0 transition-opacity duration-150 ${activeIndicatorClass} ${
                          item.active ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-3">
              <Link
                href="/"
                className="block text-center text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                Về Cổng Khách Hàng OTA
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TOP HEADER - STICKY */}
      <header className="fixed top-0 left-0 lg:left-72 right-0 h-20 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 z-40 flex items-center justify-between px-4 sm:px-6 lg:px-10 shadow-[0_1px_8px_rgba(0,0,0,0.02)]">
        {/* Left Section: Mobile Toggle & Quick Search */}
        <div className="flex items-center gap-3 sm:gap-6 flex-1 max-w-2xl">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative flex items-center w-full max-w-sm sm:max-w-md lg:max-w-lg bg-slate-50 rounded-xl px-3.5 py-2 border border-slate-200 focus-within:border-slate-900 transition-colors">
            <Search className="w-4.5 h-4.5 text-slate-400 mr-2.5 shrink-0" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, khách hàng, số điện thoại..."
              className="bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden w-full font-medium"
            />
          </div>

          {/* Operational Date Indicator (Hidden on small screens) */}
          <div className="hidden xl:flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 shrink-0">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="capitalize">{currentDateFormatted || 'Hôm nay'}</span>
          </div>
        </div>

        {/* Right Section: System Indicator, Notifications, User Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Live System Indicator */}
          <div className="hidden sm:inline-flex items-center gap-2 bg-surface-container-low px-3.5 py-1.5 rounded-xl border border-outline-variant/30 text-sm font-bold text-stone-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="whitespace-nowrap font-bold text-stone-800">Trực Tuyến</span>
          </div>

          {/* Notifications Button */}
          <button
            type="button"
            onClick={handleNotificationClick}
            className="relative p-2.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            title="Xem thông báo điều hành"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
          </button>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="h-10 inline-flex items-center gap-2.5 pl-1.5 pr-3 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all cursor-pointer select-none"
              title={displayName}
            >
              <div
                className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-black shrink-0 shadow-2xs ${
                  isPartner ? 'bg-emerald-800' : 'bg-primary'
                }`}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden md:block">
                <span className="text-xs sm:text-sm font-bold text-slate-800 block leading-none truncate whitespace-nowrap max-w-[130px] sm:max-w-[170px]">
                  {displayName}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3 border-b border-outline-variant/20 mb-2">
                  <div className="font-bold text-base text-on-surface">{displayName}</div>
                  <div className="text-xs text-outline truncate mt-0.5">{displayEmail}</div>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-container/20 text-primary text-xs font-extrabold uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{scopeBadgeLabel}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Link
                    href={isPartner ? '/partner' : '/admin'}
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-surface-container text-xs font-bold text-on-surface transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-primary" />
                    <span>{isPartner ? 'Tổng quan cơ sở' : 'Tổng quan'}</span>
                  </Link>
                  <Link
                    href={isPartner ? '/partner/bookings' : '/admin/bookings'}
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-surface-container text-xs font-bold text-on-surface transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{isPartner ? 'Khách đặt phòng' : 'Đơn đặt phòng'}</span>
                  </Link>
                  <Link
                    href={isPartner ? '/partner/payments' : '/admin/payments'}
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-surface-container text-xs font-bold text-on-surface transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span>{isPartner ? 'Doanh thu tiền phòng' : 'Lịch sử thanh toán'}</span>
                  </Link>
                  <Link
                    href={isPartner ? '/partner/rooms' : '/admin/properties'}
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-surface-container text-xs font-bold text-on-surface transition-colors"
                  >
                    <BedDouble className="w-4 h-4 text-primary" />
                    <span>{isPartner ? 'Quản lý phòng & Giá' : 'Cơ sở lưu trú & Phòng'}</span>
                  </Link>
                  <Link
                    href={isPartner ? '/partner/allotments' : '/admin/allotments'}
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-surface-container text-xs font-bold text-on-surface transition-colors"
                  >
                    <CalendarDays className="w-4 h-4 text-emerald-600" />
                    <span>Lịch giá &amp; Tồn kho</span>
                  </Link>
                  {isPartner && (
                    <Link
                      href="/partner/properties"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-surface-container text-xs font-bold text-on-surface transition-colors"
                    >
                      <Building2 className="w-4 h-4 text-emerald-700" />
                      <span>Cài đặt khách sạn</span>
                    </Link>
                  )}

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
            <span className="font-semibold text-on-surface">VietSage Booking Management Portal</span>
            <span className="text-outline-variant">•</span>
            <span>Hệ thống điều hành OTA v1.0</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
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

'use client';

import React, { useState, useRef, useEffect, useSyncExternalStore } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  Search,
  LogOut,
  LogIn,
  Shield,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';

export function UserMenu() {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Link
          href="/booking/lookup"
          title="Tra cứu đơn đặt phòng"
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border border-outline-variant/60 hover:border-primary/60 bg-surface-container-lowest/90 hover:bg-surface-container text-on-surface hover:text-primary text-xs sm:text-base font-bold transition-all shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
        >
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
          <span className="hidden sm:inline">Tra cứu đơn</span>
        </Link>
        <Link
          href="/login"
          title="Đăng nhập Cổng Quản trị & Đối tác"
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border border-outline-variant/60 hover:border-primary/60 bg-surface-container-lowest/90 hover:bg-surface-container text-on-surface hover:text-primary text-xs sm:text-base font-bold transition-all shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
        >
          <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
          <span className="hidden sm:inline">Đăng nhập</span>
        </Link>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2 animate-pulse">
        <div className="h-9 sm:h-10 w-10 sm:w-28 rounded-full bg-surface-container/60" />
        <div className="h-9 sm:h-10 w-10 sm:w-28 rounded-full bg-surface-container/60" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Link
          href="/booking/lookup"
          title="Tra cứu đơn đặt phòng"
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border border-outline-variant/60 hover:border-primary/60 bg-surface-container-lowest/90 hover:bg-surface-container text-on-surface hover:text-primary text-xs sm:text-base font-bold transition-all shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
        >
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
          <span className="hidden sm:inline">Tra cứu đơn</span>
        </Link>
        <Link
          href="/login"
          title="Đăng nhập Cổng Quản trị & Đối tác"
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border border-outline-variant/60 hover:border-primary/60 bg-surface-container-lowest/90 hover:bg-surface-container text-on-surface hover:text-primary text-xs sm:text-base font-bold transition-all shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
        >
          <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
          <span className="hidden sm:inline">Đăng nhập</span>
        </Link>
      </div>
    );
  }

  const user = session?.user as { role?: string; name?: string | null; email?: string | null } | undefined;
  const isPartner = user?.role === 'HOTEL_PARTNER';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="inline-flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 rounded-full bg-surface-container-lowest border border-outline-variant/40 hover:border-primary/40 shadow-xs transition-all cursor-pointer"
      >
        <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-black">
          {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-xs font-bold text-on-surface line-clamp-1 max-w-[120px]">
            {user?.name || (isPartner ? 'Đối Tác Khách Sạn' : 'Quản Trị Viên')}
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-outline transition-transform duration-200" />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-3 border-b border-outline-variant/20 mb-2">
            <div className="font-bold text-base text-on-surface">
              {user?.name || (isPartner ? 'Đối Tác Khách Sạn' : 'Quản Trị Viên VietSage')}
            </div>
            <div className="text-xs text-outline truncate mt-0.5">
              {user?.email || 'Phiên làm việc nội bộ'}
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-container/20 text-primary text-xs font-extrabold uppercase tracking-wider">
              <CheckCircle2 className="w-3 h-3" />
              <span>{isPartner ? 'Đối Tác Khách Sạn' : 'Quản Trị Viên'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <Link
              href="/booking/lookup"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-surface-container text-xs font-bold text-on-surface transition-colors"
            >
              <Search className="w-4 h-4 text-primary" />
              <span>Tra cứu đơn đặt phòng</span>
            </Link>

            <Link
              href={isPartner ? '/partner' : '/admin'}
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-surface-container text-xs font-bold text-on-surface transition-colors"
            >
              <Shield className="w-4 h-4 text-primary" />
              <span>{isPartner ? 'Cổng Đối Tác Khách Sạn' : 'Bảng Quản Trị'}</span>
            </Link>

            <Link
              href={isPartner ? '/partner/allotments' : '/admin/allotments'}
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-surface-container text-xs font-bold text-on-surface transition-colors"
            >
              <Shield className="w-4 h-4 text-outline" />
              <span>Lịch Tồn Kho & Giá Phòng</span>
            </Link>



            <div className="h-px bg-outline-variant/20 my-1" />

            <button
              onClick={async () => {
                setIsDropdownOpen(false);
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
  );
}

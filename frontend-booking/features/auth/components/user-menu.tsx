'use client';

import React, { useState, useRef, useEffect, useSyncExternalStore } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  Search,
  LogOut,
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
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full border border-outline-variant/40 hover:border-primary/60 bg-surface-container-lowest/80 text-on-surface hover:text-primary text-xs sm:text-base font-bold transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          <span>Tra cứu đơn</span>
        </Link>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="w-9 h-9 rounded-full bg-surface-container animate-pulse" />
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Link
          href="/booking/lookup"
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full border border-outline-variant/40 hover:border-primary/60 bg-surface-container-lowest/80 text-on-surface hover:text-primary text-xs sm:text-base font-bold transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          <span>Tra cứu đơn</span>
        </Link>
        <Link
          href="/login"
          title="Cổng Quản Trị & Đối Tác Khách Sạn"
          className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-outline hover:text-on-surface hover:bg-surface-container text-xs font-semibold transition-colors"
        >
          <Shield className="w-3.5 h-3.5 text-outline" />
          <span>Đối tác</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="inline-flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 rounded-full bg-surface-container-lowest border border-outline-variant/40 hover:border-primary/40 shadow-xs transition-all cursor-pointer"
      >
        <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-black">
          {(session.user.name || session.user.email || 'U').charAt(0).toUpperCase()}
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-xs font-bold text-on-surface line-clamp-1 max-w-[120px]">
            {session.user.name || 'Quản Trị Viên'}
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-outline transition-transform duration-200" />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-3 border-b border-outline-variant/20 mb-2">
            <div className="font-bold text-base text-on-surface">
              {session.user.name || 'Quản Trị Viên VietSage'}
            </div>
            <div className="text-xs text-outline truncate mt-0.5">
              {session.user.email || 'Phiên làm việc nội bộ'}
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-container/20 text-primary text-xs font-extrabold uppercase tracking-wider">
              <CheckCircle2 className="w-3 h-3" />
              <span>Quản Trị Viên</span>
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
              href="/admin"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-surface-container text-xs font-bold text-on-surface transition-colors"
            >
              <Shield className="w-4 h-4 text-primary" />
              <span>Bảng Quản Trị</span>
            </Link>

            <Link
              href="/admin/allotments"
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

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  LogIn,
  LogOut,
  Shield,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { LoginModal } from './login-modal';

export function UserMenu() {
  const { data: session, status } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  if (status === 'loading') {
    return (
      <div className="w-9 h-9 rounded-full bg-surface-container animate-pulse" />
    );
  }

  if (!session?.user) {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full border border-outline-variant/40 hover:border-primary/60 bg-surface-container-lowest/80 text-on-surface hover:text-primary text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          <span>Đăng nhập</span>
        </button>

        <LoginModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </>
    );
  }

  const user = session.user as { name?: string | null; email?: string | null; role?: string };
  const role = user.role || 'TRAVELER';
  const isAdminOrPartner = ['SUPER_ADMIN', 'ADMIN', 'HOTEL_PARTNER'].includes(role);

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
            {session.user.name || 'Người Dùng'}
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-outline transition-transform duration-200" />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-3 border-b border-outline-variant/20 mb-2">
            <div className="font-bold text-sm text-on-surface">
              {session.user.name || 'Tài khoản VietSage'}
            </div>
            <div className="text-xs text-outline truncate mt-0.5">
              {session.user.email || 'Đã xác thực phiên'}
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-container/20 text-primary text-[10px] font-extrabold uppercase tracking-wider">
              <CheckCircle2 className="w-3 h-3" />
              <span>{role}</span>
            </div>
          </div>

          <div className="space-y-1">
            {isAdminOrPartner && (
              <Link
                href="/admin"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-surface-container text-xs font-bold text-on-surface transition-colors"
              >
                <Shield className="w-4 h-4 text-primary" />
                <span>Bảng Quản Trị Đối Tác</span>
              </Link>
            )}

            <button
              onClick={() => {
                setIsDropdownOpen(false);
                signOut({ redirect: false });
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

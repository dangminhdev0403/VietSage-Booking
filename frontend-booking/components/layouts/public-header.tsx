'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, CalendarCheck } from 'lucide-react';
import { UserMenu } from '@/features/auth/components/user-menu';

function PublicHeaderContent() {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<'home' | 'destinations' | 'catalog-stream'>('home');
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pathname !== '/') {
      return;
    }

    const checkActiveSection = () => {
      if (isScrollingRef.current) return;

      const destinationsEl = document.getElementById('destinations');
      const catalogEl = document.getElementById('catalog-stream');

      // Check if user has scrolled to the bottom of the page
      const isNearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60;
      if (isNearBottom && catalogEl) {
        setActiveSection('catalog-stream');
        return;
      }

      // Detection threshold accounts for 80px sticky header + 60px breathing space
      const scrollPosition = window.scrollY + 140;

      const destinationsTop = destinationsEl
        ? destinationsEl.getBoundingClientRect().top + window.scrollY
        : Infinity;
      const catalogTop = catalogEl
        ? catalogEl.getBoundingClientRect().top + window.scrollY
        : Infinity;

      if (scrollPosition >= catalogTop) {
        setActiveSection('catalog-stream');
      } else if (scrollPosition >= destinationsTop) {
        setActiveSection('destinations');
      } else {
        setActiveSection('home');
      }
    };

    const initTimer = setTimeout(() => {
      checkActiveSection();
      if (window.location.hash === '#destinations') {
        setActiveSection('destinations');
      } else if (window.location.hash === '#catalog-stream') {
        setActiveSection('catalog-stream');
      }
    }, 0);

    window.addEventListener('scroll', checkActiveSection, { passive: true });
    window.addEventListener('hashchange', checkActiveSection);

    return () => {
      clearTimeout(initTimer);
      window.removeEventListener('scroll', checkActiveSection);
      window.removeEventListener('hashchange', checkActiveSection);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [pathname]);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: 'home' | 'destinations' | 'catalog-stream'
  ) => {
    if (pathname === '/') {
      e.preventDefault();
      setActiveSection(targetId);
      isScrollingRef.current = true;

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 700);

      if (targetId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.pushState(null, '', '/');
        return;
      }

      const el = document.getElementById(targetId);
      if (el) {
        // 80px header height + 24px comfortable margin so title is never cut off
        const headerOffset = 104;
        const elPosition = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: Math.max(0, elPosition - headerOffset),
          behavior: 'smooth',
        });
        window.history.pushState(null, '', `/#${targetId}`);
      }
    }
  };

  const getNavLinkClass = (section: 'home' | 'destinations' | 'catalog-stream') => {
    const isActive = pathname === '/' && activeSection === section;
    return `px-4 py-2 text-base rounded-xl transition-all whitespace-nowrap cursor-pointer ${
      isActive
        ? 'font-bold bg-primary-container/25 text-on-primary-container shadow-xs'
        : 'font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
    }`;
  };

  return (
    <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_2px_16px_rgba(197,168,128,0.08)]">
      <div className="w-full max-w-[1360px] mx-auto px-6 lg:px-10">
        <div className="h-20 flex items-center justify-between gap-6">
          {/* Brand Logo: VietSageBooking */}
          <Link
            href="/"
            onClick={(e) => handleNavClick(e, 'home')}
            className="flex items-center gap-2.5 sm:gap-3.5 group shrink-0"
          >
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
              onClick={(e) => handleNavClick(e, 'home')}
              className={getNavLinkClass('home')}
            >
              Trang chủ
            </Link>
            <Link
              href="/#destinations"
              onClick={(e) => handleNavClick(e, 'destinations')}
              className={getNavLinkClass('destinations')}
            >
              Điểm đến Tinh hoa
            </Link>
            <Link
              href="/#catalog-stream"
              onClick={(e) => handleNavClick(e, 'catalog-stream')}
              className={getNavLinkClass('catalog-stream')}
            >
              Bộ sưu tập Phòng
            </Link>
            <Link
              href="/booking/lookup"
              className={`px-4 py-2 text-base rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                pathname === '/booking/lookup'
                  ? 'font-bold bg-primary-container/25 text-on-primary-container shadow-xs'
                  : 'font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              Tra cứu đơn
            </Link>
          </nav>

          {/* Right Public Actions (User Menu + Primary CTA) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <UserMenu />
            <Link
              href="/#destinations"
              onClick={(e) => handleNavClick(e, 'destinations')}
              className="hidden sm:inline-flex items-center gap-2 h-11 px-6 rounded-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-all text-base font-extrabold shadow-sm whitespace-nowrap cursor-pointer active:scale-95"
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

function PublicHeaderFallback() {
  return (
    <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_2px_16px_rgba(197,168,128,0.08)]">
      <div className="w-full max-w-[1360px] mx-auto px-6 lg:px-10">
        <div className="h-20 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3.5 group shrink-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
              <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-amber-200" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black text-on-surface tracking-tight leading-tight">
                VietSage<span className="text-primary font-bold">Booking</span>
              </span>
              <span className="hidden sm:block text-xs tracking-wider text-outline font-semibold">
                Đặt Phòng &amp; Nghỉ Dưỡng Trực Tuyến
              </span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            <Link
              href="/"
              className="px-4 py-2 text-base font-bold rounded-xl bg-primary-container/25 text-on-primary-container whitespace-nowrap"
            >
              Trang chủ
            </Link>
            <Link
              href="/#destinations"
              className="px-4 py-2 text-base font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all rounded-xl whitespace-nowrap"
            >
              Điểm đến Tinh hoa
            </Link>
            <Link
              href="/#catalog-stream"
              className="px-4 py-2 text-base font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all rounded-xl whitespace-nowrap"
            >
              Bộ sưu tập Phòng
            </Link>
            <Link
              href="/booking/lookup"
              className="px-4 py-2 text-base font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all rounded-xl whitespace-nowrap"
            >
              Tra cứu đơn
            </Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <UserMenu />
            <Link
              href="/#destinations"
              className="hidden sm:inline-flex items-center gap-2 h-11 px-6 rounded-full bg-primary text-on-primary text-base font-extrabold shadow-sm whitespace-nowrap"
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

export function PublicHeader() {
  return (
    <Suspense fallback={<PublicHeaderFallback />}>
      <PublicHeaderContent />
    </Suspense>
  );
}

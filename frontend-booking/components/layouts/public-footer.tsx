'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { VietSageLogo } from '@/components/shared/vietsage-logo';

function PublicFooterContent() {
  const pathname = usePathname();

  if (pathname === '/login') {
    return null;
  }

  return (
    <footer className="bg-surface-container-low border-t border-outline-variant/30 py-12">
      <div className="max-w-[1360px] mx-auto px-6 lg:px-10 flex flex-col lg:flex-row items-center justify-between gap-6 text-on-surface-variant">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left shrink-0">
          <div className="shrink-0 flex items-center">
            <VietSageLogo variant="horizontal" size="sm" asLink />
          </div>
          <span className="hidden sm:inline text-outline/40 select-none">•</span>
          <p className="text-xs sm:text-sm text-on-surface-variant font-medium leading-relaxed max-w-md text-pretty">
            Nền tảng Đặt phòng Trực tuyến &amp; Trải nghiệm Du lịch Nghỉ dưỡng Cao cấp
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs uppercase tracking-wider text-outline font-bold">
          <span className="whitespace-nowrap">Cam kết giá tốt</span>
          <span className="whitespace-nowrap">Hỗ trợ 24/7</span>
          <span className="whitespace-nowrap">Xác nhận tức thì</span>
          <span className="text-outline-variant hidden sm:inline select-none">•</span>
          <Link href="/login" className="hover:text-primary transition-colors text-xs font-semibold normal-case whitespace-nowrap">
            Cổng Quản Trị &amp; Đối Tác
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function PublicFooter() {
  return (
    <Suspense fallback={null}>
      <PublicFooterContent />
    </Suspense>
  );
}

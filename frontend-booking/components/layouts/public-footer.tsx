import React from 'react';
import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="bg-surface-container-low border-t border-outline-variant/30 mt-20 py-14">
      <div className="max-w-[1360px] mx-auto px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-6 text-base text-on-surface-variant">
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <span className="text-lg font-black text-on-surface">
            VietSage<span className="text-primary">Booking</span>
          </span>
          <span className="hidden sm:inline text-outline">•</span>
          <span>
            Nền tảng Đặt phòng Trực tuyến &amp; Trải nghiệm Du lịch Nghỉ dưỡng Cao cấp
          </span>
        </div>
        <div className="flex items-center gap-6 text-xs uppercase tracking-wider text-outline font-bold whitespace-nowrap">
          <span>Cam kết giá tốt</span>
          <span>Hỗ trợ 24/7</span>
          <span>Xác nhận tức thì</span>
          <span className="text-outline-variant">•</span>
          <Link href="/login" className="hover:text-primary transition-colors text-xs font-semibold normal-case">
            Cổng Quản Trị &amp; Đối Tác
          </Link>
        </div>
      </div>
    </footer>
  );
}

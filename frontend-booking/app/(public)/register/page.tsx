'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  Search,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  CalendarCheck,
} from 'lucide-react';

export default function RegisterRedirectPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(6);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.replace('/booking/lookup');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-[calc(100vh-10rem)] bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-xl p-8 sm:p-10 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-primary-container/20 text-primary flex items-center justify-center mx-auto shadow-sm">
          <CalendarCheck className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container/20 text-primary text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Trải Nghiệm Đặt Phòng Tiện Lợi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
            Đặt Phòng Không Cần Tài Khoản
          </h1>
          <p className="text-xs sm:text-base text-outline leading-relaxed font-light">
            Tại VietSageBooking, quý khách có thể thoải mái đặt phòng và trải nghiệm dịch vụ nghỉ dưỡng cao cấp mà <strong className="text-on-surface font-semibold">không bắt buộc phải đăng ký tài khoản</strong>.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-left text-xs space-y-2.5">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="text-on-surface">
              Mã xác nhận đặt phòng và vé điện tử được gửi trực tiếp qua Email và SMS.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="text-on-surface">
              Dễ dàng tra cứu, quản lý hoặc thanh toán đơn phòng chỉ với Mã đơn và Số điện thoại.
            </span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/booking/lookup"
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container font-extrabold text-xs transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Tra Cứu Đơn Đặt Phòng</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high font-bold text-xs transition-all border border-outline-variant/30 flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4 text-primary" />
            <span>Khám Phá Điểm Đến</span>
          </Link>
        </div>

        <p className="text-xs text-outline pt-2">
          Hệ thống sẽ tự động chuyển hướng đến trang Tra cứu đơn sau <span className="font-bold text-primary">{countdown}</span> giây...
        </p>
      </div>
    </div>
  );
}

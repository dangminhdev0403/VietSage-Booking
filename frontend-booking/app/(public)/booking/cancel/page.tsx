'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

function BookingCancelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingCode = searchParams.get('booking_code') || '';

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      window.close();
      router.push('/');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-16 flex-1 text-center">
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/40 p-8 sm:p-10 shadow-md space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <AlertCircle className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-800 bg-amber-100/70 px-3.5 py-1 rounded-full">
            Phiên Thanh Toán Đã Dừng
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
            Chưa Hoàn Tất Thanh Toán
          </h1>
          <p className="text-sm text-outline max-w-md mx-auto">
            Quý khách đã hủy phiên thanh toán thẻ quốc tế qua Stripe cho đơn{' '}
            {bookingCode && <strong className="font-mono text-primary">{bookingCode}</strong>}.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-low text-xs text-outline space-y-1.5 max-w-md mx-auto text-left border border-outline-variant/30">
          <p className="font-semibold text-on-surface">Đừng lo lắng:</p>
          <p>
            • Phòng của quý khách vẫn đang được tạm giữ trong thời hạn 30 phút.
          </p>
          <p>
            • Quý khách có thể đóng tab này để quay lại tab đặt phòng và thanh toán bằng chuyển khoản VietQR (Napas 247) hoặc thử lại cổng Stripe.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-primary text-on-primary font-bold text-xs uppercase tracking-wider hover:bg-[#584323] transition-all cursor-pointer shadow-sm"
          >
            Đóng Tab &amp; Quay Lại Trang Đặt Phòng
          </button>

          {bookingCode && (
            <Link
              href={`/booking/lookup?code=${encodeURIComponent(bookingCode)}`}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs uppercase tracking-wider transition-all border border-outline-variant/40"
            >
              Tra Cứu &amp; Thanh Toán Sau
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookingCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BookingCancelContent />
    </Suspense>
  );
}

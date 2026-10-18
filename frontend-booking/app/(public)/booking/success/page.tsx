'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Sparkles, ExternalLink } from 'lucide-react';
import { lookupBooking, verifyCheckoutPayment } from '@/features/bookings/service/bookings.client';
import { BookingInvoice, BookingInvoiceData } from '@/features/bookings/components/booking-invoice';

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingCode = searchParams.get('booking_code') || searchParams.get('code') || '';
  const lookupToken = searchParams.get('token') || searchParams.get('lookup_token') || '';
  const sessionId = searchParams.get('session_id') || '';

  const [bookingData, setBookingData] = useState<BookingInvoiceData | null>(null);

  useEffect(() => {
    if (!bookingCode) return;

    let active = true;

    // 1. Verify with backend & Stripe API to sync status immediately
    verifyCheckoutPayment({
      booking_code: bookingCode,
      session_id: sessionId || undefined,
      lookup_token: lookupToken || undefined,
    })
      .then(() => {
        // Broadcast across tabs
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          try {
            const channel = new BroadcastChannel('ota_booking_sync');
            channel.postMessage({
              type: 'PAYMENT_SUCCESS',
              booking_code: bookingCode,
            });
            channel.close();
          } catch (err) {
            console.warn('[BroadcastChannel Note]', err);
          }
        }
      })
      .catch((err) => {
        console.warn('[Verify Checkout Note]', err);
      });

    // 2. If token is present, fetch and display full invoice immediately
    if (lookupToken) {
      lookupBooking(bookingCode, lookupToken)
        .then((res) => {
          if (active && res) {
            setBookingData({
              booking_code: res.booking_code,
              lookup_token: lookupToken,
              property_name: res.property_name || 'Khu nghỉ dưỡng cao cấp',
              property_address: res.property_address,
              room_type_name: res.room_type_name,
              guest_name: res.guest_name,
              guest_email: res.guest_email,
              guest_phone: res.guest_phone,
              check_in: res.check_in,
              check_out: res.check_out,
              nights: res.nights,
              total_price: res.total_price,
              deposit_amount: res.deposit_amount,
              balance_due: res.balance_due,
              status: res.status,
              payment_status: res.payment_status || 'DEPOSIT_PAID',
              addons: res.addons,
              created_at: res.created_at,
            });
          }
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [bookingCode, lookupToken]);

  const handleCloseTab = () => {
    if (typeof window !== 'undefined') {
      window.close();
      // Fallback if browser blocks script close
      router.push('/');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12 flex-1">
      {bookingData ? (
        <BookingInvoice data={bookingData} onClose={handleCloseTab} />
      ) : (
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/40 p-8 sm:p-12 shadow-md text-center max-w-2xl mx-auto space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary-container/20 px-3.5 py-1 rounded-full">
              Thanh Toán Hoàn Tất • Stripe Verified
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              Giao Dịch Đặt Cọc Thành Công!
            </h1>
            <p className="text-sm text-outline max-w-md mx-auto leading-relaxed">
              Hệ thống đã ghi nhận khoản thanh toán cọc 30% cho mã đặt phòng{' '}
              <strong className="text-primary font-mono text-base">{bookingCode || 'của quý khách'}</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs text-outline space-y-2 max-w-md mx-auto text-left">
            <div className="flex items-center gap-2 font-bold text-on-surface">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Tab đặt phòng ban đầu đã tự động cập nhật!</span>
            </div>
            <p>
              Nếu quý khách vẫn mở tab đặt phòng trước đó, trang đã tự động chuyển sang <strong>Hóa Đơn Điện Tử</strong>. Quý khách có thể đóng tab này để quay lại tab chính hoặc tra cứu bên dưới.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleCloseTab}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-primary text-on-primary font-bold text-xs uppercase tracking-wider hover:bg-[#584323] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
            >
              <span>Đóng Tab Này &amp; Về Trang Chính</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {bookingCode && (
              <Link
                href={`/booking/lookup?code=${encodeURIComponent(bookingCode)}`}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs uppercase tracking-wider transition-all border border-outline-variant/40 flex items-center justify-center gap-2"
              >
                <span>Xem Chi Tiết Đơn Đặt Phòng</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BookingSuccessContent />
    </Suspense>
  );
}

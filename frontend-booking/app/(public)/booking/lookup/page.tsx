'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  MapPin,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  FileText,
} from 'lucide-react';
import {
  lookupBooking,
  createPaymentIntent,
  createDepositCheckout,
} from '@/features/bookings/service/bookings.client';
import { BookingInvoice } from '@/features/bookings/components/booking-invoice';

type BookingLookupResult = {
  id: string;
  booking_code: string;
  lookup_token?: string;
  property_id: string;
  property_name: string;
  property_address?: string | null;
  property_city?: string | null;
  room_type_name?: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  nights: number;
  total_price: number;
  deposit_amount?: number;
  balance_due?: number;
  currency?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | string;
  payment_status: 'UNPAID' | 'PAID' | 'DEPOSIT_PAID' | string;
  special_requests?: string | null;
  addons?: { service_name: string; price: number }[];
  created_at: string;
};

type PaymentIntentResult = {
  id: string;
  booking_id: string;
  booking_code: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  transaction_ref: string;
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  transfer_content: string;
  qr_code_url: string;
  created_at: string;
};

function GuestBookingLookupContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || searchParams.get('booking_code') || '';
  const initialContact = searchParams.get('token') || searchParams.get('lookup_token') || searchParams.get('contact') || '';

  const [bookingCode, setBookingCode] = useState(initialCode);
  const [contact, setContact] = useState(initialContact);
  const [loading, setLoading] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [booking, setBooking] = useState<BookingLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFullInvoice, setShowFullInvoice] = useState(false);

  // Payment intent state
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentResult | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  const performLookup = useCallback(async (codeToUse: string, contactToUse: string) => {
    if (!codeToUse.trim() || !contactToUse.trim()) {
      setError('Quý khách vui lòng nhập đầy đủ mã đặt phòng và thông tin liên hệ');
      return;
    }

    setLoading(true);
    setError(null);
    setBooking(null);
    setPaymentIntent(null);
    setRefreshNotice(null);

    try {
      const data = (await lookupBooking(codeToUse.trim(), contactToUse.trim())) as BookingLookupResult;
      setBooking(data);

      if (data.status === 'CONFIRMED' || data.payment_status === 'DEPOSIT_PAID' || data.payment_status === 'PAID') {
        setShowFullInvoice(true);
      }

      // Automatically generate payment intent if unpaid, passing verified contact capability
      if (data.status === 'PENDING' || data.payment_status === 'UNPAID') {
        createPaymentIntent(data.id, 'VIETQR', contactToUse.trim())
          .then((intent) => setPaymentIntent(intent as PaymentIntentResult))
          .catch(() => {});
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không tìm thấy hồ sơ đặt phòng phù hợp');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto lookup if query parameters exist in URL
  useEffect(() => {
    let active = true;
    if (initialCode && initialContact) {
      lookupBooking(initialCode.trim(), initialContact.trim())
        .then((data) => {
          if (active && data) {
            setBooking(data as BookingLookupResult);
            if (
              data.status === 'CONFIRMED' ||
              data.payment_status === 'DEPOSIT_PAID' ||
              data.payment_status === 'PAID'
            ) {
              setShowFullInvoice(true);
            }
            if (data.status === 'PENDING' || data.payment_status === 'UNPAID') {
              createPaymentIntent(data.id, 'VIETQR', initialContact.trim())
                .then((intent) => {
                  if (active) setPaymentIntent(intent as PaymentIntentResult);
                })
                .catch(() => {});
            }
          }
        })
        .catch((err: unknown) => {
          if (active) {
            setError(err instanceof Error ? err.message : 'Không tìm thấy hồ sơ đặt phòng phù hợp');
          }
        });
    }
    return () => {
      active = false;
    };
  }, [initialCode, initialContact]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(bookingCode, contact);
  };

  const handleStripeCheckout = async () => {
    if (!booking) return;
    setStripeLoading(true);
    try {
      const res = await createDepositCheckout({
        booking_code: booking.booking_code,
        lookup_token: contact.trim(),
      });
      if (res?.checkout_url) {
        // Open Stripe in NEW TAB so current page is never lost
        window.open(res.checkout_url, '_blank', 'noopener,noreferrer');
        setRefreshNotice({
          type: 'info',
          message: 'Cổng thanh toán Stripe đã được mở ở một tab mới. Hệ thống đang tự động đợi xác nhận khi quý khách hoàn tất...',
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể khởi tạo cổng thanh toán Stripe lúc này');
    } finally {
      setStripeLoading(false);
    }
  };

  const handleCheckStatus = useCallback(async () => {
    if (!booking) return;
    setPaymentLoading(true);
    setRefreshNotice(null);
    try {
      const refreshed = (await lookupBooking(bookingCode.trim(), contact.trim())) as BookingLookupResult;
      setBooking(refreshed);
      if (
        refreshed.payment_status === 'PAID' ||
        refreshed.payment_status === 'DEPOSIT_PAID' ||
        refreshed.status === 'CONFIRMED'
      ) {
        setShowFullInvoice(true);
        setRefreshNotice({
          type: 'success',
          message: 'Thanh toán đã được ghi nhận thành công! Đơn đặt phòng đã được xác nhận giữ chỗ.',
        });
      } else {
        setRefreshNotice({
          type: 'info',
          message: 'Hệ thống đang chờ đối soát giao dịch từ ngân hàng hoặc cổng Stripe. Đơn phòng sẽ tự động xác nhận ngay khi ghi nhận thanh toán.',
        });
      }
    } catch (err: unknown) {
      setRefreshNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Không thể kiểm tra trạng thái lúc này',
      });
    } finally {
      setPaymentLoading(false);
    }
  }, [booking, bookingCode, contact]);

  // Window focus & BroadcastChannel cross-tab synchronization
  useEffect(() => {
    if (!booking) return;
    const isPaid =
      booking.payment_status === 'DEPOSIT_PAID' ||
      booking.payment_status === 'PAID' ||
      booking.status === 'CONFIRMED';
    if (isPaid) return;

    const handleFocus = () => {
      handleCheckStatus();
    };
    window.addEventListener('focus', handleFocus);

    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel('ota_booking_sync');
      channel.onmessage = (event) => {
        if (
          event.data?.type === 'PAYMENT_SUCCESS' &&
          event.data?.booking_code === booking.booking_code
        ) {
          handleCheckStatus();
        }
      };
    }

    return () => {
      window.removeEventListener('focus', handleFocus);
      if (channel) channel.close();
    };
  }, [booking, handleCheckStatus]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 flex-1">
      {/* Title & Introduction */}
      <div className="text-center max-w-2xl mx-auto space-y-3 mb-10 print:hidden">
        <span className="text-xs uppercase tracking-widest text-primary font-extrabold bg-primary-container/20 px-3.5 py-1 rounded-full">
          Dịch Vụ Khách Hàng Tự Phục Vụ (Self-Service)
        </span>
        <h1 className="text-3xl sm:text-4xl font-sans font-extrabold text-on-surface tracking-tight">
          Tra Cứu Đơn Đặt Phòng
        </h1>
        <p className="text-sm text-outline leading-relaxed">
          Dành cho khách hàng đặt phòng trực tuyến. Nhập mã đặt phòng kèm Mã tra cứu bảo mật (Lookup Token), email hoặc số điện thoại để xem chi tiết lịch trình và thanh toán tức thì.
        </p>
      </div>

      {/* Lookup Form (noValidate disables browser native popup) */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/40 p-6 sm:p-9 shadow-md max-w-2xl mx-auto mb-10 print:hidden">
        <form noValidate onSubmit={handleLookup} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
              Mã Đặt Phòng (Booking Code)
            </label>
            <input
              type="text"
              placeholder="Ví dụ: OTA-202610-A1B2C3"
              value={bookingCode}
              onChange={(e) => setBookingCode(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-hidden font-mono text-base tracking-wider uppercase text-on-surface bg-surface-container-low transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
              Mã Tra Cứu (Lookup Token), Email hoặc Số Điện Thoại
            </label>
            <input
              type="text"
              placeholder="Nhập mã tra cứu bảo mật, email hoặc số điện thoại"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-hidden text-base text-on-surface bg-surface-container-low transition-colors"
            />
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-primary text-on-primary font-bold text-base hover:bg-[#584323] transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang tra cứu hệ thống...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Tra Cứu Kỳ Nghỉ</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Lookup Results */}
      {booking && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Toggle between Invoice and Overview if confirmed */}
          {(booking.status === 'CONFIRMED' ||
            booking.payment_status === 'DEPOSIT_PAID' ||
            booking.payment_status === 'PAID') && (
            <div className="flex items-center justify-between bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/40 print:hidden">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Đơn phòng đã được xác nhận thanh toán đặt cọc.</span>
              </div>
              <button
                type="button"
                onClick={() => setShowFullInvoice(!showFullInvoice)}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border border-outline-variant/40"
              >
                <FileText className="w-4 h-4 text-primary" />
                <span>{showFullInvoice ? 'Thu Gọn Hóa Đơn' : 'Xem & In Hóa Đơn Điện Tử'}</span>
              </button>
            </div>
          )}

          {/* Full Invoice Render */}
          {showFullInvoice ? (
            <BookingInvoice
              data={{
                booking_code: booking.booking_code,
                lookup_token: contact.trim(),
                property_name: booking.property_name,
                property_address: booking.property_address,
                property_city: booking.property_city,
                room_type_name: booking.room_type_name,
                guest_name: booking.guest_name,
                guest_email: booking.guest_email,
                guest_phone: booking.guest_phone,
                check_in: booking.check_in,
                check_out: booking.check_out,
                nights: booking.nights,
                total_price: booking.total_price,
                deposit_amount: booking.deposit_amount,
                balance_due: booking.balance_due,
                status: booking.status,
                payment_status: booking.payment_status,
                addons: booking.addons,
                created_at: booking.created_at,
              }}
              showCloseButton={false}
              showLookupLink={false}
            />
          ) : (
            /* Standard Booking Details Card */
            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/40 p-8 shadow-md space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-black text-primary bg-primary-container/20 px-3.5 py-1 rounded-full">
                      {booking.booking_code}
                    </span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        booking.status === 'CONFIRMED' ||
                        booking.payment_status === 'DEPOSIT_PAID' ||
                        booking.payment_status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : booking.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      ● {booking.status === 'CONFIRMED' || booking.payment_status === 'DEPOSIT_PAID' ? 'Đã Xác Nhận Giữ Phòng' : booking.status === 'PENDING' ? 'Chờ Thanh Toán Cọc' : 'Đã Hủy'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-sans font-bold text-on-surface mt-2 tracking-tight">
                    {booking.property_name}
                  </h2>
                  <p className="text-xs text-outline flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>{booking.property_address || 'Địa điểm nghỉ dưỡng'}</span>
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-outline uppercase font-bold tracking-wider">Tổng Giá Tiền</span>
                  <div className="text-2xl sm:text-3xl font-black text-primary">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.total_price)}
                  </div>
                  <span className="text-xs text-emerald-700 font-semibold">
                    {booking.payment_status === 'PAID' || booking.payment_status === 'DEPOSIT_PAID' ? '✓ Đã thanh toán tiền cọc 30%' : 'Chưa thanh toán'}
                  </span>
                </div>
              </div>

              {/* Grid Information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-on-surface">
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1">
                  <span className="text-outline font-semibold">Hạng phòng</span>
                  <div className="font-bold text-base text-on-surface">{booking.room_type_name || 'Phòng nghỉ dưỡng'}</div>
                  <div className="text-outline text-xs">{booking.nights} đêm lưu trú</div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1">
                  <span className="text-outline font-semibold">Ngày nhận / trả phòng</span>
                  <div className="font-bold text-base text-on-surface">{booking.check_in} → {booking.check_out}</div>
                  <div className="text-outline text-xs">Check-in 14:00 • Check-out 12:00</div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1">
                  <span className="text-outline font-semibold">Khách đại diện</span>
                  <div className="font-bold text-base text-on-surface">{booking.guest_name}</div>
                  <div className="text-outline text-xs">{booking.guest_phone}</div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Options (if unpaid) */}
          {booking.status === 'PENDING' &&
            booking.payment_status !== 'PAID' &&
            booking.payment_status !== 'DEPOSIT_PAID' && (
              <div className="space-y-6">
                {/* 30% Deposit Stripe Card (Opens in New Tab) */}
                <div className="bg-surface-container-lowest rounded-3xl border-2 border-primary-container p-7 shadow-lg space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/30 pb-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-primary" />
                        Thanh Toán Đặt Cọc 30% Trực Tuyến
                      </span>
                      <h3 className="text-xl font-bold text-on-surface mt-1">
                        Cổng Thanh Toán Quốc Tế Stripe
                      </h3>
                      <p className="text-xs text-outline mt-0.5">
                        Thanh toán bảo mật chuẩn quốc tế qua Visa, MasterCard, JCB hoặc Apple Pay.
                      </p>
                    </div>

                    <div className="text-left sm:text-right bg-amber-50 p-3 rounded-xl border border-amber-200">
                      <span className="text-xs text-amber-800 font-bold uppercase block">
                        Số tiền cọc 30%
                      </span>
                      <span className="text-xl font-black text-amber-950">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                          booking.deposit_amount ?? Math.round(booking.total_price * 0.3),
                        )}
                      </span>
                      <span className="text-xs text-amber-800 block">
                        70% còn lại (
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                          booking.balance_due ??
                            booking.total_price - Math.round(booking.total_price * 0.3),
                        )}
                        ) thanh toán tại quầy
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-outline">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Mở trong tab mới • Tự động hiển thị hóa đơn khi quay lại</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleStripeCheckout}
                      disabled={stripeLoading}
                      className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary hover:bg-[#584323] text-on-primary font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                    >
                      {stripeLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Đang kết nối Stripe...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          <span>Thanh Toán Cọc 30% Qua Stripe (Mở Tab Mới)</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* VietQR Payment Card (Alternative) */}
                {paymentIntent && (
                  <div className="bg-surface-container-lowest rounded-3xl border border-primary/40 p-8 shadow-xl space-y-6">
                    <div className="text-center space-y-2">
                      <span className="text-xs uppercase font-extrabold tracking-widest text-primary">
                        Thanh Toán An Toàn Qua VietQR Napas 247
                      </span>
                      <h3 className="text-2xl font-sans font-bold text-on-surface">
                        Chuyển Khoản Ngân Hàng Tức Thì
                      </h3>
                      <p className="text-xs text-outline max-w-md mx-auto">
                        Vui lòng quét mã QR hoặc chuyển khoản đúng cú pháp bên dưới để hệ thống tự động đối soát và xác nhận đơn phòng.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                      <div className="md:col-span-5 text-center">
                        <div className="p-4 rounded-3xl bg-surface-container-low border border-outline-variant/40 inline-block shadow-inner">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={paymentIntent.qr_code_url}
                            alt="Mã VietQR"
                            className="w-56 h-56 object-contain rounded-xl bg-white p-2 shadow-sm"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-7 space-y-4">
                        <div className="bg-surface-container p-5 rounded-2xl text-xs space-y-3 border border-outline-variant/30">
                          <div className="flex justify-between">
                            <span className="text-outline">Ngân hàng thụ hưởng:</span>
                            <span className="font-bold text-on-surface">{paymentIntent.bank_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-outline">Số tài khoản:</span>
                            <span className="font-bold font-mono text-base text-on-surface">
                              {paymentIntent.account_number}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-outline">Chủ tài khoản:</span>
                            <span className="font-bold text-on-surface">{paymentIntent.account_holder}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-outline">Số tiền cần chuyển:</span>
                            <span className="font-black text-base text-primary">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                                paymentIntent.amount,
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-outline-variant/30 pt-2 items-center">
                            <span className="text-outline font-semibold">Cú pháp chuyển khoản:</span>
                            <div className="flex items-center gap-1 font-mono font-bold text-primary text-base bg-primary-container/20 px-2 py-0.5 rounded">
                              <span>{paymentIntent.transfer_content}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(paymentIntent.transfer_content);
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 2000);
                                }}
                                className="p-1 hover:text-on-surface cursor-pointer"
                                title="Sao chép cú pháp"
                              >
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2">
                          {refreshNotice && (
                            <div
                              className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 ${
                                refreshNotice.type === 'success'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : refreshNotice.type === 'error'
                                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                                  : 'bg-amber-50 border-amber-200 text-amber-800'
                              }`}
                            >
                              {refreshNotice.type === 'success' ? (
                                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 shrink-0" />
                              )}
                              <span>{refreshNotice.message}</span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={handleCheckStatus}
                            disabled={paymentLoading}
                            className="w-full h-12 rounded-full bg-primary text-on-primary font-bold text-base hover:bg-[#584323] transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {paymentLoading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Đang kiểm tra hệ thống đối soát...</span>
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4" />
                                <span>Kiểm Tra Trạng Thái Thanh Toán</span>
                              </>
                            )}
                          </button>
                          <p className="text-xs text-center text-outline">
                            Sau khi quý khách chuyển khoản thành công, hệ thống hoặc lễ tân khách sạn sẽ đối soát tự động và cập nhật trạng thái đơn phòng.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
      )}
    </div>
  );
}

export default function GuestBookingLookupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <GuestBookingLookupContent />
    </Suspense>
  );
}

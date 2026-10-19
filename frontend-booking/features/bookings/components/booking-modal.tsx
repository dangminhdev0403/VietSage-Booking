'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Copy,
  Check,
  CreditCard,
  ShieldCheck,
  Maximize2,
  Waves,
  Bed,
  Users,
  Coffee,
  ExternalLink,
  Sparkles,
  Lock,
  QrCode,
  RefreshCw,
  MapPin,
  Star,
  Calendar,
  Building2,
  BedDouble,
} from 'lucide-react';
import {
  useCreateBookingMutation,
  useBookingQuoteQuery,
  useDepositCheckoutMutation,
} from '../hooks/use-bookings';
import { lookupBooking, verifyCheckoutPayment } from '../service/bookings.client';
import { Property } from '@/features/catalog/components/property-card';
import { luxuryAlert } from '@/lib/alert/luxury-alert';
import { LuxuryAlertBanner } from '@/components/shared/luxury-alert-banner';
import { BookingInvoice, BookingInvoiceData } from './booking-invoice';

function formatDateYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDaysToYMD(ymdStr: string, days: number): string {
  const parts = ymdStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return ymdStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() + days);
  return formatDateYMD(d);
}

function diffDaysYMD(checkInStr: string, checkOutStr: string): number {
  const p1 = checkInStr.split('-').map(Number);
  const p2 = checkOutStr.split('-').map(Number);
  if (p1.length !== 3 || p2.length !== 3 || p1.some(isNaN) || p2.some(isNaN)) return 0;
  const d1 = new Date(p1[0], p1[1] - 1, p1[2]);
  const d2 = new Date(p2[0], p2[1] - 1, p2[2]);
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
}

export function BookingModal({
  property,
  initialRoomId,
  onClose,
}: {
  property: Property;
  initialRoomId?: string;
  onClose: () => void;
}) {
  const todayYMD = formatDateYMD(new Date());
  const defaultCheckIn = addDaysToYMD(todayYMD, 1);

  const roomTypes = property.room_types || [];
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [checkIn, setCheckIn] = useState(() => defaultCheckIn);
  const [checkOut, setCheckOut] = useState(() => addDaysToYMD(defaultCheckIn, 2));
  const [selectedRoomId, setSelectedRoomId] = useState(
    initialRoomId || roomTypes[0]?.id || '',
  );
  const [specialRequests] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Payment waiting & verification state
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [openedPaymentTab, setOpenedPaymentTab] = useState(false);

  const [confirmedBooking, setConfirmedBooking] = useState<
    (BookingInvoiceData & { checkout_url?: string }) | null
  >(null);

  const createMutation = useCreateBookingMutation();
  const checkoutMutation = useDepositCheckoutMutation();

  const selectedRoom = roomTypes.find((r) => r.id === selectedRoomId) || roomTypes[0];
  const roomPrice = selectedRoom?.base_price || 4500000;

  // Nights calculation & Date Range Validity
  const diffDays = diffDaysYMD(checkIn, checkOut);
  const isValidDateRange = diffDays >= 1;
  const nights = isValidDateRange ? diffDays : 0;

  // Handlers for date changes & quick night selection
  const handleCheckInChange = (newCheckIn: string) => {
    setCheckIn(newCheckIn);
    // Keep current nights (minimum 1 night) and automatically advance check-out
    const currentNights = Math.max(1, nights);
    const newCheckOut = addDaysToYMD(newCheckIn, currentNights);
    setCheckOut(newCheckOut);
    if (fieldErrors.dates) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.dates;
        return copy;
      });
    }
  };

  const handleCheckOutChange = (newCheckOut: string) => {
    setCheckOut(newCheckOut);
    const newDiff = diffDaysYMD(checkIn, newCheckOut);
    if (newDiff < 1) {
      setFieldErrors((prev) => ({
        ...prev,
        dates: 'Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm',
      }));
    } else if (fieldErrors.dates) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.dates;
        return copy;
      });
    }
  };

  const handleSelectNights = (n: number) => {
    const validNights = Math.max(1, n);
    const newCheckOut = addDaysToYMD(checkIn, validNights);
    setCheckOut(newCheckOut);
    if (fieldErrors.dates) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.dates;
        return copy;
      });
    }
  };

  // Authoritative server-side quote query
  const quoteQuery = useBookingQuoteQuery(
    {
      property_id: property.id,
      room_type_id: selectedRoomId || roomTypes[0]?.id || '',
      check_in: checkIn,
      check_out: checkOut,
      guests: selectedRoom?.max_guests ?? 2,
    },
    { enabled: Boolean(isValidDateRange && (selectedRoomId || roomTypes[0]?.id)) },
  );

  const isQuoteFetching = quoteQuery.isFetching;
  const quote = quoteQuery.data;

  // Extract real-time stop-sell or allotment availability error
  const quoteError = quoteQuery.error as
    | { response?: { data?: { error?: { message?: string } } }; message?: string }
    | null
    | undefined;
  const quoteErrorMessage = quoteError
    ? quoteError.response?.data?.error?.message ||
      quoteError.message ||
      'Hạng phòng tạm thời không khả dụng trong khoảng thời gian đã chọn.'
    : null;

  // Pricing values (authoritative quote with local fallback directly: basePrice * nights)
  const roomSubtotal = quote?.room_subtotal ?? (isValidDateRange ? roomPrice * nights : 0);
  const totalPrice = quote?.total_price ?? (isValidDateRange ? roomPrice * nights : 0);
  const depositAmount = quote?.deposit_amount ?? Math.round(totalPrice * 0.3);
  const balanceDue = quote?.balance_due ?? (totalPrice - depositAmount);

  const isSubmitDisabled =
    createMutation.isPending ||
    checkoutMutation.isPending ||
    Boolean(quoteErrorMessage) ||
    !isValidDateRange ||
    isQuoteFetching;

  const handleCopy = (text: string, type: 'code' | 'token') => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else if (type === 'token') {
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2000);
      }
      luxuryAlert.toast('Đã sao chép vào bộ nhớ tạm', 'success');
    }
  };

  // Status check function for polling and tab return
  const checkPaymentStatus = useCallback(
    async (isManual = false) => {
      if (!confirmedBooking?.booking_code || !confirmedBooking?.lookup_token) return;
      if (
        confirmedBooking.payment_status === 'DEPOSIT_PAID' ||
        confirmedBooking.payment_status === 'PAID' ||
        confirmedBooking.status === 'CONFIRMED'
      ) {
        return;
      }

      if (isManual) setCheckingStatus(true);
      try {
        // 1. Direct Stripe checkout verification via backend
        try {
          const verifyRes = await verifyCheckoutPayment({
            booking_code: confirmedBooking.booking_code,
            lookup_token: confirmedBooking.lookup_token,
          });
          if (verifyRes?.is_paid) {
            setConfirmedBooking((prev) => ({
              ...prev!,
              status: verifyRes.status || 'CONFIRMED',
              payment_status: verifyRes.payment_status || 'DEPOSIT_PAID',
              paid_at: verifyRes.paid_at || new Date().toISOString(),
            }));
            await luxuryAlert.success({
              title: 'Thanh Toán Cọc Thành Công',
              message: 'Thanh toán cọc thành công! Hóa đơn xác nhận kỳ nghỉ của quý khách đã sẵn sàng.',
              confirmText: 'Xem Hóa Đơn',
            });
            return;
          }
        } catch {}

        // 2. Fallback to booking lookup if verify didn't resolve or on manual check
        if (isManual) {
          const refreshed = await lookupBooking(
            confirmedBooking.booking_code,
            confirmedBooking.lookup_token,
          );

          if (
            refreshed &&
            (refreshed.payment_status === 'DEPOSIT_PAID' ||
              refreshed.payment_status === 'PAID' ||
              refreshed.status === 'CONFIRMED')
          ) {
            setConfirmedBooking((prev) => ({
              ...prev!,
              status: refreshed.status,
              payment_status: refreshed.payment_status || 'DEPOSIT_PAID',
              paid_at: (refreshed as { paid_at?: string }).paid_at || new Date().toISOString(),
            }));
            await luxuryAlert.success({
              title: 'Thanh Toán Cọc Thành Công',
              message: 'Thanh toán cọc thành công! Hóa đơn xác nhận kỳ nghỉ của quý khách đã sẵn sàng.',
              confirmText: 'Xem Hóa Đơn',
            });
          } else {
            await luxuryAlert.info({
              title: 'Đang Chờ Đối Soát',
              message: 'Hệ thống đang chờ nhận thông báo giao dịch từ cổng thanh toán Stripe...',
              confirmText: 'Đã Hiểu',
            });
          }
        }
      } catch (err) {
        console.warn('[Payment Check Silent Catch]', err);
      } finally {
        if (isManual) setCheckingStatus(false);
      }
    },
    [confirmedBooking],
  );

  // Real-time Polling & Cross-tab Synchronization
  useEffect(() => {
    if (!confirmedBooking) return;
    const isPaid =
      confirmedBooking.payment_status === 'DEPOSIT_PAID' ||
      confirmedBooking.payment_status === 'PAID' ||
      confirmedBooking.status === 'CONFIRMED';
    if (isPaid) return;

    // 1. Polling every 4 seconds
    const interval = setInterval(() => {
      checkPaymentStatus(false);
    }, 4000);

    // 2. Visibility change & Window focus listener
    const handleFocus = () => {
      checkPaymentStatus(false);
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkPaymentStatus(false);
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    // 3. BroadcastChannel cross-tab listener
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel('ota_booking_sync');
      channel.onmessage = (event) => {
        if (
          event.data?.type === 'PAYMENT_SUCCESS' &&
          event.data?.booking_code === confirmedBooking.booking_code
        ) {
          checkPaymentStatus(false);
        }
      };
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (channel) channel.close();
    };
  }, [confirmedBooking, checkPaymentStatus]);


  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const errors: Record<string, string> = {};

    const roomTypeId = selectedRoomId || roomTypes[0]?.id;
    if (!roomTypeId) {
      errors.room = 'Vui lòng chọn hạng phòng';
    }

    if (!isValidDateRange) {
      errors.dates = 'Ngày trả phòng phải sau ngày nhận phòng';
    }

    if (guestName.trim().length < 2) {
      errors.guestName = 'Vui lòng nhập họ và tên';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!guestEmail.trim() || !emailRegex.test(guestEmail.trim())) {
      errors.guestEmail = 'Email không hợp lệ';
    }

    const phoneDigits = guestPhone.trim().replace(/\D/g, '');
    if (!guestPhone.trim() || phoneDigits.length < 8) {
      errors.guestPhone = 'Số điện thoại tối thiểu 8 số';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    try {
      // 1. Create anonymous booking on server (holds allotment, generates 32-byte lookup token)
      const res = await createMutation.mutateAsync({
        property_id: property.id,
        room_type_id: roomTypeId,
        guest_name: guestName.trim(),
        guest_email: guestEmail.trim(),
        guest_phone: guestPhone.trim(),
        check_in: checkIn,
        check_out: checkOut,
        guests: selectedRoom?.max_guests ?? 2,
        special_requests: specialRequests || undefined,
      });

      let checkoutUrl: string | undefined;

      // 2. Automatically initialize Stripe Deposit Checkout
      try {
        const checkoutRes = await checkoutMutation.mutateAsync({
          booking_code: res.booking_code,
          lookup_token: res.lookup_token,
        });
        if (checkoutRes?.checkout_url) {
          checkoutUrl = checkoutRes.checkout_url;
          setOpenedPaymentTab(true);
          if (typeof window !== 'undefined') {
            window.open(checkoutRes.checkout_url, '_blank');
          }
        }
      } catch (checkoutErr) {
        console.warn('[Checkout Init Note]', checkoutErr);
      }

      setConfirmedBooking({
        booking_code: res.booking_code,
        lookup_token: res.lookup_token,
        property_name: property.name,
        property_address: property.address,
        property_city: property.city,
        room_type_name: selectedRoom?.name || 'Phòng nghỉ dưỡng',
        guest_name: guestName.trim(),
        guest_email: guestEmail.trim(),
        guest_phone: guestPhone.trim(),
        check_in: checkIn,
        check_out: checkOut,
        nights,
        guests: selectedRoom?.max_guests ?? 2,
        total_price: res.total_price || totalPrice,
        deposit_amount: res.deposit_amount ?? depositAmount,
        balance_due: res.balance_due ?? balanceDue,
        status: res.status,
        payment_status: res.payment_status || 'UNPAID',
        checkout_url: checkoutUrl,
        addons: [],
      });

      luxuryAlert.toast('Đang mở cổng thanh toán bảo mật Stripe...', 'info');
    } catch (err: unknown) {
      const formatted = luxuryAlert.formatApiError(err);
      setErrorMessage(formatted.message);
    }
  };

  const formatVND = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const isConfirmedOrPaid =
    confirmedBooking &&
    (confirmedBooking.payment_status === 'DEPOSIT_PAID' ||
      confirmedBooking.payment_status === 'PAID' ||
      confirmedBooking.status === 'CONFIRMED');

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-surface-container-lowest rounded-3xl max-w-5xl lg:max-w-6xl xl:max-w-7xl w-full p-5 sm:p-6 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.2)] border border-outline-variant/40 relative my-auto max-h-[94vh] flex flex-col overflow-hidden">
        <button
          onClick={onClose}
          type="button"
          aria-label="Đóng cửa sổ đặt phòng"
          className="absolute top-5 right-5 p-2 rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer z-10 print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {isConfirmedOrPaid ? (
          /* ================= 1. OFFICIAL INVOICE & RECEIPT SCREEN ================= */
          <div className="overflow-y-auto flex-1 p-1">
            <BookingInvoice data={confirmedBooking!} onClose={onClose} />
          </div>
        ) : confirmedBooking ? (
          /* ================= 2. PAYMENT & STRIPE WAITING SCREEN ================= */
          <div className="space-y-5 overflow-y-auto flex-1 p-1">
            {/* Header Status */}
            <div className="text-center space-y-1.5 border-b border-outline-variant/40 pb-4">
              <span className="text-xs uppercase tracking-wider text-amber-900 font-bold inline-flex items-center gap-1.5 bg-amber-100/90 px-3.5 py-1 rounded-full border border-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                Đang Chờ Thanh Toán Tiền Cọc 30%
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-on-surface">
                Thanh Toán Cọc 30% Để Xác Nhận Đặt Phòng
              </h3>
              <p className="text-xs text-outline max-w-xl mx-auto">
                Vui lòng quét mã QR hoặc hoàn tất thanh toán trên cổng Stripe. Đơn đặt phòng sẽ được tự động tạo và xuất hóa đơn xác nhận ngay khi nhận được thanh toán.
              </p>
            </div>

            {/* Main Content Grid: QR on Left, Details & CTA on Right */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
              {/* Left Column (5 cols): Dynamic QR Code */}
              <div className="md:col-span-5 p-5 rounded-2xl bg-surface-container-low border border-outline-variant/40 flex flex-col items-center justify-center text-center space-y-3">
                <div className="flex items-center gap-1.5 text-primary font-bold text-xs uppercase tracking-wider">
                  <QrCode className="w-4 h-4" />
                  <span>Quét Mã QR Thanh Toán Nhanh</span>
                </div>

                {confirmedBooking.checkout_url ? (
                  <div className="p-3 rounded-2xl bg-white border border-outline-variant/40 shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(confirmedBooking.checkout_url)}`}
                      alt="Mã QR Thanh Toán Stripe"
                      className="w-44 h-44 object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="w-44 h-44 rounded-xl bg-surface-container flex items-center justify-center text-outline text-xs">
                    Đang tải mã QR...
                  </div>
                )}

                <p className="text-xs text-outline max-w-xs leading-relaxed">
                  Mở camera điện thoại quét mã để thanh toán trực tiếp qua <strong>Apple Pay, Google Pay hoặc Thẻ Quốc Tế</strong>.
                </p>
              </div>

              {/* Right Column (7 cols): Order Details & Stripe Button */}
              <div className="md:col-span-7 p-5 rounded-2xl bg-surface-container-low border border-primary/20 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  {/* Property & Stay Summary */}
                  <div className="space-y-1 border-b border-outline-variant/30 pb-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-primary">
                      Khu Nghỉ Dưỡng &amp; Hạng Phòng
                    </div>
                    <div className="font-bold text-sm text-on-surface">
                      {confirmedBooking.property_name}
                    </div>
                    <div className="text-xs text-outline flex items-center gap-2 flex-wrap">
                      <span>{confirmedBooking.room_type_name}</span>
                      <span>•</span>
                      <span>{confirmedBooking.nights} đêm ({confirmedBooking.check_in} → {confirmedBooking.check_out})</span>
                    </div>
                  </div>

                  {/* 30% Deposit Amount Banner */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/80 border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-amber-900 uppercase block">
                          Tiền Cọc 30% Cần Thanh Toán:
                        </span>
                        <span className="text-xs text-amber-800">
                          70% còn lại thanh toán tại quầy khi nhận phòng
                        </span>
                      </div>
                      <span className="text-xl sm:text-2xl font-black text-amber-950">
                        {formatVND(confirmedBooking.deposit_amount ?? 0)}
                      </span>
                    </div>
                  </div>

                  {/* Card Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="px-2 py-0.5 rounded bg-surface-container-lowest border border-outline-variant/40 text-xs font-semibold text-on-surface">Visa</span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-lowest border border-outline-variant/40 text-xs font-semibold text-on-surface">MasterCard</span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-lowest border border-outline-variant/40 text-xs font-semibold text-on-surface">JCB</span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-lowest border border-outline-variant/40 text-xs font-semibold text-on-surface">Amex</span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-lowest border border-outline-variant/40 text-xs font-semibold text-on-surface">Apple Pay</span>
                  </div>

                  {/* Open Stripe Tab Button */}
                  {confirmedBooking.checkout_url && (
                    <a
                      href={confirmedBooking.checkout_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpenedPaymentTab(true)}
                      className="w-full py-3.5 px-4 rounded-xl bg-primary text-on-primary hover:bg-[#584323] font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Mở Lại Cổng Thanh Toán Stripe (Tab Mới)</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  {openedPaymentTab && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Cổng Stripe đã được mở ở tab mới. Vui lòng hoàn tất thanh toán và quay lại tab này.</span>
                    </div>
                  )}
                </div>

                {/* Real-time Listening Indicator */}
                <div className="p-3 rounded-xl bg-primary-container/15 border border-primary/20 flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-primary block">
                      Hệ thống đang tự động lắng nghe giao dịch...
                    </span>
                    <span className="text-xs text-outline">
                      Đơn đặt phòng sẽ được tự động tạo và xuất hóa đơn ngay khi thanh toán thành công.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => checkPaymentStatus(true)}
                disabled={checkingStatus}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border border-outline-variant/40"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-primary ${checkingStatus ? 'animate-spin' : ''}`} />
                <span>{checkingStatus ? 'Đang kiểm tra...' : 'Kiểm Tra Thanh Toán Ngay'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-outline hover:text-on-surface text-xs font-semibold transition-colors cursor-pointer"
              >
                Đóng &amp; Hoàn Tất Sau
              </button>
            </div>
          </div>
        ) : (
          /* ================= 3. MAIN BOOKING FORM (2-COLUMN SPLIT MASTER-DETAIL) ================= */
          <form noValidate onSubmit={handleBookingSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Header */}
            <div className="border-b border-outline-variant/40 pb-3 mb-3 shrink-0 pr-8">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-xs uppercase tracking-wider font-bold">Đặt Phòng Trực Tuyến</span>
                <span className="text-xs text-outline">•</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  Xác nhận tức thì &amp; Giữ Allotment
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-on-surface leading-tight">
                {property.name}
              </h2>
              <p className="text-xs text-outline mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{property.address}, {property.city}</span>
              </p>
            </div>

            {errorMessage && (
              <div className="mb-3 shrink-0">
                <LuxuryAlertBanner
                  variant="error"
                  title="Lưu Ý"
                  description={errorMessage}
                  onClose={() => setErrorMessage(null)}
                  actionText="Đóng"
                  onAction={() => setErrorMessage(null)}
                />
              </div>
            )}

            {quoteErrorMessage && (
              <div className="mb-3 shrink-0">
                <LuxuryAlertBanner
                  variant="warning"
                  title="Hạng Phòng Tạm Khóa / Hết Chỗ"
                  description={quoteErrorMessage}
                />
              </div>
            )}

            {/* 2-Column Split Body */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 min-h-0 overflow-y-auto md:overflow-visible">
              {/* ================= CỘT TRÁI (COL 1 - 7): Tùy chọn phòng & Thông tin khách ================= */}
              <div className="md:col-span-7 flex flex-col space-y-3.5 md:overflow-y-auto md:pr-2 md:max-h-[calc(94vh-130px)]">
                {/* 1. Lịch trình & Thông tin khách liên hệ (Combined Stay Dates & Guest Info) */}
                <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-3">
                  {/* Row A: Stay Dates */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs uppercase tracking-wider font-bold text-primary flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Thời Gian Lưu Trú
                      </span>
                      {isValidDateRange ? (
                        <span className="text-xs text-outline font-medium">
                          Tổng <strong className="text-primary font-bold">{nights} đêm</strong> nghỉ
                        </span>
                      ) : (
                        <span className="text-xs text-rose-600 font-semibold">
                          Ngày trả phòng chưa hợp lệ
                        </span>
                      )}
                    </div>

                    {/* Quick Duration Selection Buttons (1 đêm, 2 đêm, 3 đêm, 5 đêm, 7 đêm + stepper) */}
                    <div className="mb-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-outline">
                        <span className="font-semibold text-on-surface-variant">Chọn nhanh số đêm:</span>
                        <div className="flex items-center gap-1 bg-surface-container rounded-lg p-0.5 border border-outline-variant/40">
                          <button
                            type="button"
                            onClick={() => handleSelectNights(Math.max(1, nights - 1))}
                            disabled={nights <= 1}
                            className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Giảm 1 đêm"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-bold text-primary whitespace-nowrap min-w-14 text-center">
                            {isValidDateRange ? `${nights} đêm` : 'Tùy chọn'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSelectNights(nights + 1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                            title="Tăng 1 đêm"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {[1, 2, 3, 5, 7].map((num) => {
                          const isActive = isValidDateRange && nights === num;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => handleSelectNights(num)}
                              className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
                                isActive
                                  ? 'bg-primary text-on-primary border-primary shadow-xs'
                                  : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/50 hover:border-primary/60 hover:text-primary'
                              }`}
                            >
                              {num} đêm
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wider font-bold text-outline block">
                          Nhận phòng
                        </label>
                        <input
                          type="date"
                          min={todayYMD}
                          value={checkIn}
                          onChange={(e) => handleCheckInChange(e.target.value)}
                          className={`w-full px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-container-lowest border transition-colors focus:outline-none ${
                            fieldErrors.dates
                              ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20'
                              : 'border-outline-variant/60 focus:border-primary'
                          }`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wider font-bold text-outline block">
                          Trả phòng {isValidDateRange ? `(${nights} đêm)` : '(chưa hợp lệ)'}
                        </label>
                        <input
                          type="date"
                          min={addDaysToYMD(checkIn, 1)}
                          value={checkOut}
                          onChange={(e) => handleCheckOutChange(e.target.value)}
                          className={`w-full px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-container-lowest border transition-colors focus:outline-none ${
                            fieldErrors.dates
                              ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20'
                              : 'border-outline-variant/60 focus:border-primary'
                          }`}
                        />
                      </div>
                      {fieldErrors.dates && (
                        <div className="col-span-2 text-xs text-rose-600 font-medium">
                          {fieldErrors.dates}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row B: Guest Information (Cùng khối với trường ngày đặt) */}
                  <div className="border-t border-outline-variant/30 pt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs uppercase tracking-wider font-bold text-primary flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        Thông Tin Khách Liên Hệ
                      </span>
                      <span className="text-xs text-outline">
                        Nhận mã tra cứu &amp; xác nhận
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wider font-bold text-outline block">
                          Họ &amp; Tên khách
                        </label>
                        <input
                          type="text"
                          placeholder="Nguyễn Văn A"
                          value={guestName}
                          onChange={(e) => {
                            setGuestName(e.target.value);
                            if (fieldErrors.guestName) {
                              setFieldErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.guestName;
                                return copy;
                              });
                            }
                          }}
                          className={`w-full px-3 py-1.5 text-xs rounded-lg bg-surface-container-lowest border transition-colors focus:outline-none ${
                            fieldErrors.guestName
                              ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20'
                              : 'border-outline-variant/60 focus:border-primary'
                          }`}
                        />
                        {fieldErrors.guestName && (
                          <p className="text-xs text-rose-600 font-medium mt-0.5">
                            {fieldErrors.guestName}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wider font-bold text-outline block">
                          Email nhận xác nhận
                        </label>
                        <input
                          type="email"
                          placeholder="guest@example.com"
                          value={guestEmail}
                          onChange={(e) => {
                            setGuestEmail(e.target.value);
                            if (fieldErrors.guestEmail) {
                              setFieldErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.guestEmail;
                                return copy;
                              });
                            }
                          }}
                          className={`w-full px-3 py-1.5 text-xs rounded-lg bg-surface-container-lowest border transition-colors focus:outline-none ${
                            fieldErrors.guestEmail
                              ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20'
                              : 'border-outline-variant/60 focus:border-primary'
                          }`}
                        />
                        {fieldErrors.guestEmail && (
                          <p className="text-xs text-rose-600 font-medium mt-0.5">
                            {fieldErrors.guestEmail}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wider font-bold text-outline block">
                          Số điện thoại
                        </label>
                        <input
                          type="tel"
                          placeholder="0912 345 678"
                          value={guestPhone}
                          onChange={(e) => {
                            setGuestPhone(e.target.value);
                            if (fieldErrors.guestPhone) {
                              setFieldErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.guestPhone;
                                return copy;
                              });
                            }
                          }}
                          className={`w-full px-3 py-1.5 text-xs rounded-lg bg-surface-container-lowest border transition-colors focus:outline-none ${
                            fieldErrors.guestPhone
                              ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20'
                              : 'border-outline-variant/60 focus:border-primary'
                          }`}
                        />
                        {fieldErrors.guestPhone && (
                          <p className="text-xs text-rose-600 font-medium mt-0.5">
                            {fieldErrors.guestPhone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Room Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs uppercase tracking-wider font-bold text-primary block">
                      Chọn Hạng Phòng
                    </label>
                    <span className="text-xs text-outline">
                      {roomTypes.length} hạng phòng có sẵn
                    </span>
                  </div>

                  {fieldErrors.room && (
                    <div className="text-xs text-rose-600 font-medium">
                      {fieldErrors.room}
                    </div>
                  )}

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {roomTypes.map((room) => {
                      const isSelected = selectedRoomId === room.id;
                      const guestsCount = room.max_guests || 2;
                      return (
                        <div
                          key={room.id}
                          onClick={() => {
                            setSelectedRoomId(room.id);
                            if (fieldErrors.room) {
                              setFieldErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.room;
                                return copy;
                              });
                            }
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-primary bg-primary-container/10 ring-1 ring-primary shadow-xs'
                              : 'border-outline-variant/50 bg-surface-container-lowest hover:border-primary-container/80'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {/* Left: Mini Thumbnail or BedDouble Emblem */}
                            <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                              <div className="w-14 h-14 rounded-xl shrink-0 overflow-hidden border border-outline-variant/40 bg-surface-container flex items-center justify-center">
                                {(() => {
                                  const roomThumb =
                                    room.room_images && room.room_images.length > 0
                                      ? room.room_images[0]
                                      : property.thumbnail_url || (property.images && property.images.length > 0 ? property.images[0] : null);
                                  return roomThumb ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={roomThumb}
                                      alt={room.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-surface-container-low text-primary/70 p-1 text-center">
                                      <BedDouble className="w-5 h-5 text-primary" />
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Center Info */}
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name="room_selection"
                                    checked={isSelected}
                                    onChange={() => setSelectedRoomId(room.id)}
                                    className="w-3.5 h-3.5 text-primary accent-primary cursor-pointer shrink-0"
                                  />
                                  <span className="text-sm font-bold text-on-surface leading-tight truncate">
                                    {room.name}
                                  </span>
                                  {isSelected && (
                                    <span className="text-xs font-bold text-primary bg-primary-container/30 px-1.5 py-0.5 rounded uppercase whitespace-nowrap">
                                      Đang chọn
                                    </span>
                                  )}
                                </div>

                                {/* Prominent Core Room Attributes */}
                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs text-on-surface-variant">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-low border border-outline-variant/40 whitespace-nowrap">
                                    <Users className="w-3 h-3 text-primary" />
                                    Tối đa {guestsCount} khách
                                  </span>
                                  {room.bed_type && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-low border border-outline-variant/40 whitespace-nowrap">
                                      <Bed className="w-3 h-3 text-primary" />
                                      {room.bed_type}
                                    </span>
                                  )}
                                  {room.area_sqm && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-low border border-outline-variant/40 whitespace-nowrap">
                                      <Maximize2 className="w-3 h-3 text-primary" />
                                      {room.area_sqm}m²
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right Price */}
                            <div className="text-right shrink-0 sm:border-l sm:border-outline-variant/30 sm:pl-3">
                              <span className="text-xs text-outline block">Mỗi đêm</span>
                              <span className="text-sm font-bold text-primary">
                                {formatVND(room.base_price)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ================= CỘT PHẢI (COL 8 - 12): Tóm tắt chi phí & Thanh toán cọc 30% ================= */}
              <div className="md:col-span-5 flex flex-col justify-between">
                <div className="bg-surface-container-low/80 rounded-2xl p-4.5 sm:p-5 border border-outline-variant/40 shadow-xs flex flex-col justify-between h-full space-y-4">
                  {/* Property Preview Banner */}
                  <div>
                    <div className="relative aspect-[21/9] w-full rounded-xl overflow-hidden bg-surface-container mb-3 shadow-2xs">
                      {property.thumbnail_url || property.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={property.thumbnail_url || property.images?.[0]}
                          alt={property.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#12241e] via-[#1a382f] to-[#254d42] flex flex-col items-center justify-center p-3 text-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(197,168,128,0.15),transparent_70%)] pointer-events-none" />
                          <Building2 className="w-6 h-6 text-[#d4af37] mb-1" />
                          <span className="text-white text-xs font-bold truncate max-w-[85%]">{property.name}</span>
                          <span className="text-xs text-[#d4af37] font-medium whitespace-nowrap mt-0.5">
                            Cơ sở lưu trú đã xác thực
                          </span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-surface-bright/90 backdrop-blur-xs px-2 py-0.5 rounded-full text-xs font-bold text-on-surface">
                        <Star className="w-3 h-3 fill-primary text-primary" />
                        <span>{property.star_rating >= 5 ? '5.0 Luxury' : `${property.star_rating} Sao`}</span>
                      </div>
                      <div className="absolute top-2 right-2 bg-primary text-on-primary px-2 py-0.5 rounded-full text-xs font-bold">
                        {property.city}
                      </div>
                    </div>

                    <h3 className="font-serif text-base font-bold text-on-surface line-clamp-1">
                      {property.name}
                    </h3>
                    <p className="text-xs text-outline truncate mt-0.5">
                      {selectedRoom?.name || 'Phòng nghỉ dưỡng'} • {isValidDateRange ? `${nights} đêm (${checkIn} → ${checkOut})` : 'Khoảng ngày chưa hợp lệ'}
                    </p>
                  </div>

                  {/* Price breakdown */}
                  <div className="space-y-2 text-xs pt-1 border-t border-outline-variant/30">
                    <div className="flex justify-between text-xs font-bold text-on-surface pt-1">
                      <span>Tổng tiền phòng {isValidDateRange ? `(${nights} đêm):` : ':'}</span>
                      <span className="text-sm font-extrabold">
                        {isValidDateRange ? formatVND(totalPrice) : '---'}
                      </span>
                    </div>

                    {/* 30% Deposit Prominent Highlight */}
                    <div className="mt-2 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/70 border border-amber-200/90 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
                            Cọc 30% thanh toán ngay
                          </span>
                          <span className="text-xs text-amber-800 block mt-0.5">
                            {isValidDateRange
                              ? `(70% còn lại ${formatVND(balanceDue)} trả khi check-in)`
                              : 'Vui lòng chọn ngày trả phòng hợp lệ'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg sm:text-xl font-black text-amber-950">
                            {isValidDateRange ? formatVND(depositAmount) : '---'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CTA Submit Button & Security Note */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitDisabled}
                      className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-[#584323] text-on-primary font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isQuoteFetching ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                      <span>
                        {createMutation.isPending || checkoutMutation.isPending
                          ? 'Đang kết nối cổng...'
                          : !isValidDateRange
                          ? 'Vui Lòng Chọn Ngày Trả Phòng Hợp Lệ'
                          : isQuoteFetching
                          ? 'Đang tính toán giá...'
                          : quoteErrorMessage
                          ? 'Hạng Phòng Tạm Khóa / Hết Chỗ'
                          : `Xác Nhận & Thanh Toán Cọc 30% (${formatVND(depositAmount)})`}
                      </span>
                    </button>

                    <div className="text-xs text-outline flex items-center justify-center gap-1.5 text-center">
                      <Lock className="w-3 h-3 text-emerald-700 shrink-0" />
                      <span>Không cần tạo tài khoản. Cấp mã tra cứu tức thì.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

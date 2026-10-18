'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  ChevronDown,
  ChevronUp,
  Calendar,
} from 'lucide-react';
import {
  useCreateBookingMutation,
  useBookingQuoteQuery,
  useDepositCheckoutMutation,
} from '../hooks/use-bookings';
import { lookupBooking, verifyCheckoutPayment } from '../service/bookings.client';
import { useServicesQuery } from '@/features/catalog/hooks/use-catalog';
import { Property } from '@/features/catalog/components/property-card';
import { luxuryAlert } from '@/lib/alert/luxury-alert';
import { LuxuryAlertBanner } from '@/components/shared/luxury-alert-banner';
import { BookingInvoice, BookingInvoiceData } from './booking-invoice';

export function BookingModal({
  property,
  onClose,
}: {
  property: Property;
  onClose: () => void;
}) {
  const roomTypes = property.room_types || [];
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [checkIn, setCheckIn] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [selectedRoomId, setSelectedRoomId] = useState(roomTypes[0]?.id || '');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [showAllAddons, setShowAllAddons] = useState(false);
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

  const { data: services } = useServicesQuery();
  const createMutation = useCreateBookingMutation();
  const checkoutMutation = useDepositCheckoutMutation();

  const selectedRoom = roomTypes.find((r) => r.id === selectedRoomId) || roomTypes[0];
  const roomPrice = selectedRoom?.base_price || 4500000;

  // Nights calculation
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  const nights = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)));

  // Authoritative server-side quote query
  const isValidDateRange = !isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d2 > d1;
  const quoteQuery = useBookingQuoteQuery(
    {
      property_id: property.id,
      room_type_id: selectedRoomId || roomTypes[0]?.id || '',
      check_in: checkIn,
      check_out: checkOut,
      guests: selectedRoom?.max_guests ?? 2,
      service_ids: selectedServiceIds,
    },
    { enabled: Boolean(isValidDateRange && (selectedRoomId || roomTypes[0]?.id)) },
  );

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

  // Pricing values (authoritative quote with local fallback)
  const roomSubtotal = quote?.room_subtotal ?? roomPrice * nights;
  const servicesPrice = (services || [])
    .filter((s) => selectedServiceIds.includes(s.id))
    .reduce((sum, s) => sum + s.price, 0);
  const addonSubtotal = quote?.addon_subtotal ?? servicesPrice;
  const totalPrice = quote?.total_price ?? (roomSubtotal + addonSubtotal);
  const depositAmount = quote?.deposit_amount ?? Math.round(totalPrice * 0.3);
  const balanceDue = quote?.balance_due ?? (totalPrice - depositAmount);

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

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
            luxuryAlert.toast('Thanh toán cọc thành công! Hóa đơn xác nhận đã sẵn sàng.', 'success');
            return;
          }
        } catch {}

        // 2. Fallback to booking lookup
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
          luxuryAlert.toast('Thanh toán cọc thành công! Hóa đơn xác nhận đã sẵn sàng.', 'success');
        } else if (isManual) {
          luxuryAlert.toast('Hệ thống đang chờ nhận thông báo giao dịch từ Stripe...', 'info');
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

    // 1. Polling every 2.5 seconds
    const interval = setInterval(() => {
      checkPaymentStatus(false);
    }, 2500);

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
        service_ids: selectedServiceIds.length > 0 ? selectedServiceIds : undefined,
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
        addons: selectedServiceIds
          .map((id) => services?.find((s) => s.id === id))
          .filter(Boolean)
          .map((s) => ({ service_name: s!.name, price: s!.price })),
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
      <div className="bg-surface-container-lowest rounded-3xl max-w-5xl lg:max-w-6xl w-full p-5 sm:p-6 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.2)] border border-outline-variant/40 relative my-auto max-h-[94vh] flex flex-col overflow-hidden">
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 overflow-y-auto lg:overflow-visible">
              {/* ================= CỘT TRÁI (COL 1 - 7): Tùy chọn phòng & Thông tin khách ================= */}
              <div className="lg:col-span-7 flex flex-col space-y-3.5 lg:overflow-y-auto lg:pr-2 lg:max-h-[calc(94vh-130px)]">
                {/* 1. Lịch trình & Thông tin khách liên hệ (Combined Stay Dates & Guest Info) */}
                <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-3">
                  {/* Row A: Stay Dates */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs uppercase tracking-wider font-bold text-primary flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Thời Gian Lưu Trú
                      </span>
                      <span className="text-xs text-outline font-medium">
                        Tổng {nights} đêm nghỉ
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wider font-bold text-outline block">
                          Nhận phòng
                        </label>
                        <input
                          type="date"
                          value={checkIn}
                          onChange={(e) => {
                            setCheckIn(e.target.value);
                            if (fieldErrors.dates) {
                              setFieldErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.dates;
                                return copy;
                              });
                            }
                          }}
                          className={`w-full px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-container-lowest border transition-colors focus:outline-none ${
                            fieldErrors.dates
                              ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20'
                              : 'border-outline-variant/60 focus:border-primary'
                          }`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wider font-bold text-outline block">
                          Trả phòng ({nights} đêm)
                        </label>
                        <input
                          type="date"
                          value={checkOut}
                          onChange={(e) => {
                            setCheckOut(e.target.value);
                            if (fieldErrors.dates) {
                              setFieldErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.dates;
                                return copy;
                              });
                            }
                          }}
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
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            {/* Left Info */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="room_selection"
                                  checked={isSelected}
                                  onChange={() => setSelectedRoomId(room.id)}
                                  className="w-3.5 h-3.5 text-primary accent-primary cursor-pointer"
                                />
                                <span className="text-sm font-bold text-on-surface leading-tight">
                                  {room.name}
                                </span>
                                {isSelected && (
                                  <span className="text-xs font-bold text-primary bg-primary-container/30 px-1.5 py-0.5 rounded uppercase">
                                    Đang chọn
                                  </span>
                                )}
                              </div>

                              {/* Badges */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs text-on-surface-variant">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-low border border-outline-variant/40">
                                  <Maximize2 className="w-3 h-3 text-primary" />
                                  {room.name.toLowerCase().includes('villa') ? '120m²' : room.name.toLowerCase().includes('suite') ? '75m²' : '48m²'}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-low border border-outline-variant/40">
                                  <Bed className="w-3 h-3 text-primary" />
                                  {room.name.toLowerCase().includes('suite') ? '1 King hoặc 2 Twin' : '1 Giường King-size'}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-low border border-outline-variant/40">
                                  <Waves className="w-3 h-3 text-primary" />
                                  {room.name.toLowerCase().includes('beach') || room.name.toLowerCase().includes('ocean') ? 'View Biển' : 'View Vườn'}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-low border border-outline-variant/40">
                                  <Users className="w-3 h-3 text-primary" />
                                  Tối đa {guestsCount} khách
                                </span>
                              </div>

                              {/* Included Privileges */}
                              <div className="flex items-center gap-3 text-xs text-emerald-800 pt-0.5">
                                <span className="inline-flex items-center gap-1">
                                  <Coffee className="w-3 h-3 text-emerald-700" /> Buffet sáng bao gồm
                                </span>
                                <span>•</span>
                                <span>Wifi tốc độ cao</span>
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

                {/* 3. Optional Add-ons (Compact & Collapsible) */}
                {services && services.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs uppercase tracking-wider font-bold text-primary flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Dịch vụ &amp; Trải nghiệm tùy chọn
                        {selectedServiceIds.length > 0 && (
                          <span className="text-xs bg-primary text-on-primary px-1.5 py-0.2 rounded-full font-bold">
                            {selectedServiceIds.length} đã chọn
                          </span>
                        )}
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAllAddons((prev) => !prev)}
                        className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>{showAllAddons ? 'Thu gọn' : `Xem tất cả (${services.length})`}</span>
                        {showAllAddons ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>

                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 transition-all ${showAllAddons ? 'max-h-72 overflow-y-auto pr-1' : 'max-h-36 overflow-y-auto pr-1'}`}>
                      {services.map((srv) => (
                        <label
                          key={srv.id}
                          className={`p-2.5 rounded-lg border flex items-center justify-between text-xs cursor-pointer transition-all ${
                            selectedServiceIds.includes(srv.id)
                              ? 'border-primary bg-primary-container/10 ring-1 ring-primary'
                              : 'border-outline-variant/40 bg-surface-container-low hover:bg-surface-container'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedServiceIds.includes(srv.id)}
                              onChange={() => toggleService(srv.id)}
                              className="w-3.5 h-3.5 text-primary accent-primary cursor-pointer"
                            />
                            <span className="font-medium text-on-surface line-clamp-1">{srv.name}</span>
                          </div>
                          <span className="font-semibold text-primary shrink-0 ml-1">+{formatVND(srv.price)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ================= CỘT PHẢI (COL 8 - 12): Tóm tắt chi phí & Thanh toán cọc 30% ================= */}
              <div className="lg:col-span-5 flex flex-col justify-between">
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
                        <div className="w-full h-full flex items-center justify-center bg-primary-container/10 text-primary">
                          <Sparkles className="w-6 h-6" />
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
                      {selectedRoom?.name || 'Phòng nghỉ dưỡng'} • {nights} đêm ({checkIn} → {checkOut})
                    </p>
                  </div>

                  {/* Selected Addons preview (if any) */}
                  {selectedServiceIds.length > 0 && (
                    <div className="space-y-1.5 py-2 border-y border-outline-variant/30 text-xs">
                      <span className="font-bold text-primary block uppercase tracking-wider text-xs">
                        Dịch vụ đã chọn ({selectedServiceIds.length}):
                      </span>
                      <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                        {services
                          ?.filter((s) => selectedServiceIds.includes(s.id))
                          .map((s) => (
                            <div key={s.id} className="flex justify-between text-on-surface-variant">
                              <span className="truncate mr-2">• {s.name}</span>
                              <span className="font-semibold text-primary shrink-0">+{formatVND(s.price)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Price breakdown */}
                  <div className="space-y-2 text-xs pt-1 border-t border-outline-variant/30">
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Tiền phòng ({nights} đêm):</span>
                      <span className="font-semibold text-on-surface">{formatVND(roomSubtotal)}</span>
                    </div>
                    {addonSubtotal > 0 && (
                      <div className="flex justify-between text-on-surface-variant">
                        <span>Dịch vụ cộng thêm:</span>
                        <span className="font-semibold text-on-surface">+{formatVND(addonSubtotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs font-bold text-on-surface pt-1 border-t border-outline-variant/40">
                      <span>Tổng tiền phòng trọn gói:</span>
                      <span className="text-sm font-extrabold">{formatVND(totalPrice)}</span>
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
                            (70% còn lại {formatVND(balanceDue)} trả khi check-in)
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg sm:text-xl font-black text-amber-950">
                            {formatVND(depositAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CTA Submit Button & Security Note */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="submit"
                      disabled={
                        createMutation.isPending ||
                        checkoutMutation.isPending ||
                        Boolean(quoteErrorMessage) ||
                        quoteQuery.isPending
                      }
                      className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-[#584323] text-on-primary font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>
                        {createMutation.isPending || checkoutMutation.isPending
                          ? 'Đang kết nối cổng...'
                          : quoteQuery.isPending
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

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
  Calendar,
  ChevronRight,
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
  assigned_room_number?: string | null;
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
  const initialPhone =
    searchParams.get('phone') ||
    searchParams.get('sdt') ||
    searchParams.get('contact') ||
    searchParams.get('code') ||
    searchParams.get('booking_code') ||
    '';
  const initialToken =
    searchParams.get('token') || searchParams.get('lookup_token') || '';

  const [searchInput, setSearchInput] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [bookings, setBookings] = useState<BookingLookupResult[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
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

  const activeBooking =
    bookings.find((b) => b.id === selectedBookingId) || bookings[0] || null;

  const extractBookingsList = (data: unknown): BookingLookupResult[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data as BookingLookupResult[];
    if (
      typeof data === 'object' &&
      data !== null &&
      'items' in data &&
      Array.isArray((data as { items: unknown }).items)
    ) {
      return (data as { items: BookingLookupResult[] }).items;
    }
    if (typeof data === 'object' && data !== null && 'id' in data) {
      return [data as BookingLookupResult];
    }
    return [];
  };

  const loadPaymentIntentForBooking = useCallback(
    (bookingItem: BookingLookupResult, contactCapability: string) => {
      if (
        bookingItem.status === 'PENDING' ||
        bookingItem.payment_status === 'UNPAID'
      ) {
        createPaymentIntent(
          bookingItem.id,
          'BANK_TRANSFER',
          contactCapability || bookingItem.guest_phone,
        )
          .then((intent) => setPaymentIntent(intent as PaymentIntentResult))
          .catch(() => {});
      }
    },
    [],
  );

  const performLookup = useCallback(
    async (queryToUse: string, tokenArg?: string) => {
      const clean = queryToUse.trim();
      if (!clean) {
        setError('Quý khách vui lòng nhập số điện thoại hoặc mã đặt phòng để tra cứu');
        return;
      }

      setLoading(true);
      setError(null);
      setBookings([]);
      setSelectedBookingId(null);
      setPaymentIntent(null);
      setRefreshNotice(null);

      try {
        const rawData = await lookupBooking(clean, tokenArg);
        const list = extractBookingsList(rawData);

        if (list.length === 0) {
          setError(
            'Không tìm thấy đơn đặt phòng nào đang hoạt động hoặc sắp tới cho thông tin này.',
          );
        } else {
          setBookings(list);
          setSelectedBookingId(list[0].id);

          if (
            list[0].status === 'CONFIRMED' ||
            list[0].payment_status === 'DEPOSIT_PAID' ||
            list[0].payment_status === 'PAID'
          ) {
            setShowFullInvoice(true);
          } else {
            setShowFullInvoice(false);
            loadPaymentIntentForBooking(list[0], clean);
          }
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Không tìm thấy hồ sơ đặt phòng phù hợp',
        );
      } finally {
        setLoading(false);
      }
    },
    [loadPaymentIntentForBooking],
  );

  // Auto lookup if query parameters exist in URL
  useEffect(() => {
    let active = true;
    if (initialPhone) {
      lookupBooking(initialPhone.trim(), initialToken.trim() || undefined)
        .then((rawData) => {
          if (!active) return;
          const list = extractBookingsList(rawData);
          if (list.length > 0) {
            setBookings(list);
            setSelectedBookingId(list[0].id);
            if (
              list[0].status === 'CONFIRMED' ||
              list[0].payment_status === 'DEPOSIT_PAID' ||
              list[0].payment_status === 'PAID'
            ) {
              setShowFullInvoice(true);
            } else {
              loadPaymentIntentForBooking(list[0], initialPhone.trim());
            }
          }
        })
        .catch((err: unknown) => {
          if (active) {
            setError(
              err instanceof Error
                ? err.message
                : 'Không tìm thấy hồ sơ đặt phòng phù hợp',
            );
          }
        });
    }
    return () => {
      active = false;
    };
  }, [initialPhone, initialToken, loadPaymentIntentForBooking]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(searchInput, initialToken.trim() || undefined);
  };

  const handleSelectBooking = (bookingItem: BookingLookupResult) => {
    setSelectedBookingId(bookingItem.id);
    setPaymentIntent(null);
    setRefreshNotice(null);

    if (
      bookingItem.status === 'CONFIRMED' ||
      bookingItem.payment_status === 'DEPOSIT_PAID' ||
      bookingItem.payment_status === 'PAID'
    ) {
      setShowFullInvoice(true);
    } else {
      setShowFullInvoice(false);
      loadPaymentIntentForBooking(bookingItem, searchInput.trim());
    }
  };

  const handleStripeCheckout = async () => {
    if (!activeBooking) return;
    setStripeLoading(true);
    try {
      const res = await createDepositCheckout({
        booking_code: activeBooking.booking_code,
        lookup_token: searchInput.trim() || activeBooking.guest_phone,
      });
      if (res?.checkout_url) {
        window.open(res.checkout_url, '_blank', 'noopener,noreferrer');
        setRefreshNotice({
          type: 'info',
          message:
            'Cổng thanh toán Stripe đã được mở ở một tab mới. Hệ thống sẽ tự động đối soát khi quý khách hoàn tất.',
        });
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể khởi tạo cổng thanh toán Stripe lúc này',
      );
    } finally {
      setStripeLoading(false);
    }
  };

  const handleCheckStatus = useCallback(async () => {
    if (!activeBooking) return;
    setPaymentLoading(true);
    setRefreshNotice(null);
    try {
      const refreshed = (await lookupBooking(
        activeBooking.booking_code,
        searchInput.trim() || activeBooking.guest_phone,
      )) as BookingLookupResult;

      setBookings((prev) =>
        prev.map((b) => (b.id === refreshed.id ? refreshed : b)),
      );

      if (
        refreshed.payment_status === 'PAID' ||
        refreshed.payment_status === 'DEPOSIT_PAID' ||
        refreshed.status === 'CONFIRMED'
      ) {
        setShowFullInvoice(true);
        setRefreshNotice({
          type: 'success',
          message:
            'Thanh toán đã được ghi nhận thành công! Đơn đặt phòng đã được xác nhận giữ chỗ.',
        });
      } else {
        setRefreshNotice({
          type: 'info',
          message:
            'Hệ thống đang chờ đối soát giao dịch ngân hàng hoặc cổng Stripe. Đơn phòng sẽ tự động xác nhận ngay khi ghi nhận thanh toán.',
        });
      }
    } catch (err: unknown) {
      setRefreshNotice({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Không thể kiểm tra trạng thái lúc này',
      });
    } finally {
      setPaymentLoading(false);
    }
  }, [activeBooking, searchInput]);

  // Window focus & BroadcastChannel cross-tab synchronization
  useEffect(() => {
    if (!activeBooking) return;
    const isPaid =
      activeBooking.payment_status === 'DEPOSIT_PAID' ||
      activeBooking.payment_status === 'PAID' ||
      activeBooking.status === 'CONFIRMED';
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
          event.data?.booking_code === activeBooking.booking_code
        ) {
          handleCheckStatus();
        }
      };
    }

    return () => {
      window.removeEventListener('focus', handleFocus);
      if (channel) channel.close();
    };
  }, [activeBooking, handleCheckStatus]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 flex-1">
      {/* Title & Introduction */}
      <div className="text-center max-w-2xl mx-auto space-y-3 mb-10 print:hidden">
        <span className="text-xs uppercase tracking-widest text-primary font-extrabold bg-primary-container/20 px-3.5 py-1 rounded-full whitespace-nowrap inline-block">
          Dịch Vụ Khách Hàng Tự Phục Vụ
        </span>
        <h1 className="text-3xl sm:text-4xl font-sans font-extrabold text-on-surface tracking-tight text-balance">
          Tra Cứu Đơn Đặt Phòng
        </h1>
        <p className="text-sm text-outline leading-relaxed text-pretty">
          Nhập số điện thoại để tra cứu danh sách các đơn đặt phòng hiện tại và sắp tới của quý khách.
        </p>
      </div>

      {/* Streamlined Phone Lookup Form */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/40 p-6 sm:p-9 shadow-md max-w-xl mx-auto mb-10 print:hidden">
        <form noValidate onSubmit={handleLookup} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
              Số Điện Thoại Đặt Phòng
            </label>
            <div className="relative">
              <input
                type="tel"
                placeholder="Nhập số điện thoại (ví dụ: 0912 345 678) hoặc mã đặt phòng"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-hidden text-base text-on-surface bg-surface-container-low transition-colors"
              />
            </div>
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

          <p className="text-xs text-outline text-center text-pretty">
            Hệ thống hiển thị danh sách các kỳ nghỉ tính từ ngày đặt phòng của quý khách.
          </p>
        </form>
      </div>

      {/* Lookup Results Section */}
      {bookings.length > 0 && activeBooking && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Booking List Carousel / Selector if multiple bookings found */}
          {bookings.length > 1 && (
            <div className="space-y-3 print:hidden">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-on-surface text-balance">
                  Tìm thấy {bookings.length} đơn đặt phòng
                </h2>
                <span className="text-xs text-outline font-semibold">
                  Chọn đơn để xem chi tiết & thanh toán
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {bookings.map((item) => {
                  const isSelected = activeBooking.id === item.id;
                  const isConfirmed =
                    item.status === 'CONFIRMED' ||
                    item.payment_status === 'DEPOSIT_PAID' ||
                    item.payment_status === 'PAID';
                  const isPending = item.status === 'PENDING';

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectBooking(item)}
                      className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-primary/5 border-primary shadow-xs ring-1 ring-primary'
                          : 'bg-surface-container-lowest border-outline-variant/40 hover:border-outline-variant'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-black text-primary bg-primary-container/20 px-2 py-0.5 rounded-md whitespace-nowrap">
                          {item.booking_code}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                            isConfirmed
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPending
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          ● {isConfirmed ? 'Đã Xác Nhận' : isPending ? 'Chờ Cọc' : 'Đã Hủy'}
                        </span>
                      </div>

                      <div className="font-bold text-sm text-on-surface line-clamp-1 mb-1">
                        {item.property_name}
                      </div>

                      <div className="text-xs text-outline flex items-center gap-1 mb-2">
                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="whitespace-nowrap">
                          {item.check_in} → {item.check_out} ({item.nights} đêm)
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-outline-variant/20 pt-2 text-xs">
                        <span className="font-black text-primary text-sm">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(item.total_price)}
                        </span>
                        <span className="text-primary font-bold flex items-center gap-0.5">
                          {isSelected ? 'Đang chọn' : 'Xem chi tiết'}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Toggle between Invoice and Overview if confirmed */}
          {(activeBooking.status === 'CONFIRMED' ||
            activeBooking.payment_status === 'DEPOSIT_PAID' ||
            activeBooking.payment_status === 'PAID') && (
            <div className="flex items-center justify-between bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/40 print:hidden">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Đơn phòng đã được xác nhận thanh toán đặt cọc.</span>
              </div>
              <button
                type="button"
                onClick={() => setShowFullInvoice(!showFullInvoice)}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border border-outline-variant/40 whitespace-nowrap"
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
                booking_code: activeBooking.booking_code,
                lookup_token: searchInput.trim() || activeBooking.guest_phone,
                property_name: activeBooking.property_name,
                property_address: activeBooking.property_address,
                property_city: activeBooking.property_city,
                room_type_name: activeBooking.room_type_name,
                guest_name: activeBooking.guest_name,
                guest_email: activeBooking.guest_email,
                guest_phone: activeBooking.guest_phone,
                check_in: activeBooking.check_in,
                check_out: activeBooking.check_out,
                nights: activeBooking.nights,
                total_price: activeBooking.total_price,
                deposit_amount: activeBooking.deposit_amount,
                balance_due: activeBooking.balance_due,
                status: activeBooking.status,
                payment_status: activeBooking.payment_status,
                assigned_room_number: activeBooking.assigned_room_number,
                addons: activeBooking.addons,
                created_at: activeBooking.created_at,
              }}
              showCloseButton={false}
              showLookupLink={false}
            />
          ) : (
            /* Standard Booking Details Card */
            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/40 p-6 sm:p-8 shadow-md space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base sm:text-lg font-black text-primary bg-primary-container/20 px-3.5 py-1 rounded-full whitespace-nowrap">
                      {activeBooking.booking_code}
                    </span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${
                        activeBooking.status === 'CONFIRMED' ||
                        activeBooking.payment_status === 'DEPOSIT_PAID' ||
                        activeBooking.payment_status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : activeBooking.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      ●{' '}
                      {activeBooking.status === 'CONFIRMED' ||
                      activeBooking.payment_status === 'DEPOSIT_PAID'
                        ? 'Đã Xác Nhận Giữ Phòng'
                        : activeBooking.status === 'PENDING'
                        ? 'Chờ Thanh Toán Cọc'
                        : 'Đã Hủy'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-sans font-bold text-on-surface mt-2 tracking-tight text-balance">
                    {activeBooking.property_name}
                  </h2>
                  <p className="text-xs text-outline flex items-center gap-1 mt-0.5 text-pretty">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{activeBooking.property_address || 'Địa điểm nghỉ dưỡng'}</span>
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-outline uppercase font-bold tracking-wider block">
                    Tổng Giá Tiền
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-primary">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(activeBooking.total_price)}
                  </div>
                  <span className="text-xs text-emerald-700 font-semibold block">
                    {activeBooking.payment_status === 'PAID' ||
                    activeBooking.payment_status === 'DEPOSIT_PAID'
                      ? '✓ Đã thanh toán tiền cọc 30%'
                      : 'Chưa thanh toán'}
                  </span>
                </div>
              </div>

              {/* Assigned Room Badge / Banner if Confirmed and assigned */}
              {(activeBooking.status === 'CONFIRMED' ||
                activeBooking.payment_status === 'DEPOSIT_PAID' ||
                activeBooking.payment_status === 'PAID') &&
                activeBooking.assigned_room_number && (
                  <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200/90 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <span className="font-bold text-emerald-950 uppercase tracking-wider block">
                          Phòng Gán Tự Động
                        </span>
                        <span className="text-emerald-800 text-xs">
                          VietSage PMS đã cấp phát số phòng cho kỳ nghỉ của quý khách.
                        </span>
                      </div>
                    </div>
                    <div className="bg-emerald-600 text-white font-mono font-bold text-sm sm:text-base px-3.5 py-1.5 rounded-xl whitespace-nowrap shadow-xs">
                      Phòng {activeBooking.assigned_room_number}
                    </div>
                  </div>
                )}

              {/* Grid Information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-on-surface">
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1">
                  <span className="text-outline font-semibold">Hạng phòng</span>
                  <div className="font-bold text-base text-on-surface">
                    {activeBooking.room_type_name || 'Phòng nghỉ dưỡng'}
                  </div>
                  <div className="text-outline text-xs">
                    {activeBooking.nights} đêm lưu trú
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1">
                  <span className="text-outline font-semibold">Ngày nhận / trả phòng</span>
                  <div className="font-bold text-base text-on-surface">
                    {activeBooking.check_in} → {activeBooking.check_out}
                  </div>
                  <div className="text-outline text-xs">Check-in 14:00 • Check-out 12:00</div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1">
                  <span className="text-outline font-semibold">Khách đại diện</span>
                  <div className="font-bold text-base text-on-surface">
                    {activeBooking.guest_name}
                  </div>
                  <div className="text-outline text-xs">{activeBooking.guest_phone}</div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Options (if unpaid) */}
          {activeBooking.status === 'PENDING' &&
            activeBooking.payment_status !== 'PAID' &&
            activeBooking.payment_status !== 'DEPOSIT_PAID' && (
              <div className="space-y-6">
                {/* 30% Deposit Stripe Card */}
                <div className="bg-surface-container-lowest rounded-3xl border-2 border-primary-container p-6 sm:p-7 shadow-lg space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/30 pb-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 whitespace-nowrap">
                        <CreditCard className="w-4 h-4 text-primary" />
                        Thanh Toán Đặt Cọc 30% Trực Tuyến
                      </span>
                      <h3 className="text-xl font-bold text-on-surface mt-1 text-balance">
                        Cổng Thanh Toán Quốc Tế Stripe
                      </h3>
                      <p className="text-xs text-outline mt-0.5 text-pretty">
                        Thanh toán bảo mật chuẩn quốc tế qua Visa, MasterCard, JCB hoặc Apple Pay.
                      </p>
                    </div>

                    <div className="text-left sm:text-right bg-amber-50 p-3 rounded-xl border border-amber-200">
                      <span className="text-xs text-amber-800 font-bold uppercase block whitespace-nowrap">
                        Số tiền cọc 30%
                      </span>
                      <span className="text-xl font-black text-amber-950 block">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(
                          activeBooking.deposit_amount ??
                            Math.round(activeBooking.total_price * 0.3),
                        )}
                      </span>
                      <span className="text-xs text-amber-800 block">
                        70% còn lại (
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(
                          activeBooking.balance_due ??
                            activeBooking.total_price -
                              Math.round(activeBooking.total_price * 0.3),
                        )}
                        ) thanh toán tại quầy
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-outline">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Mở trong tab mới • Tự động hiển thị hóa đơn khi hoàn tất</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleStripeCheckout}
                      disabled={stripeLoading}
                      className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary hover:bg-[#584323] text-on-primary font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer whitespace-nowrap"
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

                {/* Bank Transfer Payment Card */}
                {paymentIntent && (
                  <div className="bg-surface-container-lowest rounded-3xl border border-primary/40 p-6 sm:p-8 shadow-xl space-y-6">
                    <div className="text-center space-y-2">
                      <span className="text-xs uppercase font-extrabold tracking-widest text-primary whitespace-nowrap">
                        Thanh Toán Chuyển Khoản Ngân Hàng
                      </span>
                      <h3 className="text-2xl font-sans font-bold text-on-surface text-balance">
                        Chuyển Khoản Ngân Hàng Tức Thì
                      </h3>
                      <p className="text-xs text-outline max-w-md mx-auto text-pretty">
                        Vui lòng chuyển khoản đúng thông tin và cú pháp bên dưới để hệ thống tự động đối soát và xác nhận đơn phòng.
                      </p>
                    </div>

                    <div className="max-w-xl mx-auto w-full space-y-4">
                      <div className="bg-surface-container p-5 rounded-2xl text-xs space-y-3 border border-outline-variant/30">
                        <div className="flex justify-between items-center">
                          <span className="text-outline">Ngân hàng thụ hưởng:</span>
                          <span className="font-bold text-on-surface">{paymentIntent.bank_name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-outline">Số tài khoản:</span>
                          <span className="font-bold font-mono text-base text-on-surface">
                            {paymentIntent.account_number}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-outline">Chủ tài khoản:</span>
                          <span className="font-bold text-on-surface">{paymentIntent.account_holder}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-outline">Số tiền cần chuyển:</span>
                          <span className="font-black text-base text-primary">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                            }).format(paymentIntent.amount)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-outline-variant/30 pt-2 items-center">
                          <span className="text-outline font-semibold">Cú pháp chuyển khoản:</span>
                          <div className="flex items-center gap-1 font-mono font-bold text-primary text-base bg-primary-container/20 px-2 py-0.5 rounded whitespace-nowrap">
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
                              {copied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
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
                            <span className="text-pretty">{refreshNotice.message}</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleCheckStatus}
                          disabled={paymentLoading}
                          className="w-full h-12 rounded-full bg-primary text-on-primary font-bold text-base hover:bg-[#584323] transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
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
                        <p className="text-xs text-center text-outline text-pretty">
                          Sau khi chuyển khoản thành công, hệ thống sẽ đối soát tự động và cập nhật trạng thái đơn phòng.
                        </p>
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

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  CheckCircle2,
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
} from 'lucide-react';
import {
  useCreateBookingMutation,
  useBookingQuoteQuery,
  useDepositCheckoutMutation,
} from '../hooks/use-bookings';
import { useServicesQuery } from '@/features/catalog/hooks/use-catalog';
import { Property } from '@/features/catalog/components/property-card';
import { luxuryAlert } from '@/lib/alert/luxury-alert';
import { LuxuryAlertBanner } from '@/components/shared/luxury-alert-banner';

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
  const [specialRequests] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const [confirmedBooking, setConfirmedBooking] = useState<{
    booking_code: string;
    lookup_token?: string;
    total_price: number;
    deposit_amount: number;
    balance_due: number;
    status: string;
    checkout_url?: string;
  } | null>(null);

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
      } else {
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2000);
      }
      luxuryAlert.toast('Đã sao chép vào bộ nhớ tạm', 'success');
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const roomTypeId = selectedRoomId || roomTypes[0]?.id;
    if (!roomTypeId) {
      const msg = 'Quý khách vui lòng chọn một hạng phòng trước khi tiếp tục.';
      setErrorMessage(msg);
      luxuryAlert.warning({
        title: 'Chưa Chọn Hạng Phòng',
        message: msg,
        confirmText: 'Chọn Hạng Phòng',
      });
      return;
    }

    if (!isValidDateRange) {
      const msg = 'Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm.';
      setErrorMessage(msg);
      luxuryAlert.warning({
        title: 'Lịch Trình Chưa Hợp Lệ',
        message: msg,
        confirmText: 'Điều Chỉnh Lại Ngày',
      });
      return;
    }

    if (guestName.trim().length < 2) {
      const msg = 'Quý khách vui lòng nhập họ và tên liên hệ.';
      setErrorMessage(msg);
      luxuryAlert.warning({
        title: 'Thiếu Họ & Tên Quý Khách',
        message: msg,
        confirmText: 'Nhập Họ Tên',
      });
      return;
    }

    if (guestPhone.trim().length < 8) {
      const msg = 'Số điện thoại liên hệ phải có tối thiểu 8 chữ số.';
      setErrorMessage(msg);
      luxuryAlert.warning({
        title: 'Số Điện Thoại Chưa Hợp Lệ',
        message: msg,
        confirmText: 'Kiểm Tra Lại',
      });
      return;
    }

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
        }
      } catch (checkoutErr) {
        console.warn('[Checkout Init Note]', checkoutErr);
      }

      setConfirmedBooking({
        booking_code: res.booking_code,
        lookup_token: res.lookup_token,
        total_price: res.total_price,
        deposit_amount: res.deposit_amount ?? depositAmount,
        balance_due: res.balance_due ?? balanceDue,
        status: res.status,
        checkout_url: checkoutUrl,
      });

      luxuryAlert.toast('Đơn đặt phòng đã được tạo thành công!', 'success');
    } catch (err: unknown) {
      const formatted = luxuryAlert.formatApiError(err);
      setErrorMessage(formatted.message);
      luxuryAlert.error({
        title: formatted.title,
        message: formatted.message,
        details: formatted.details,
        confirmText: 'Đã Hiểu & Kiểm Tra Lại',
      });
    }
  };

  const formatVND = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-surface-container-lowest rounded-2xl max-w-4xl w-full p-5 sm:p-7 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.2)] border border-outline-variant/40 relative my-6">
        <button
          onClick={onClose}
          type="button"
          aria-label="Đóng cửa sổ đặt phòng"
          className="absolute top-5 right-5 p-2 rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {confirmedBooking ? (
          /* ================= SUCCESS CONFIRMATION SCREEN ================= */
          <div className="text-center py-4 space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-primary font-bold">
                Xác Nhận Giữ Phòng Thành Công
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-on-surface mt-1">
                Yêu Cầu Đặt Phòng Đã Được Khởi Tạo
              </h3>
              <p className="text-xs text-outline mt-0.5">
                Hệ thống đã tạm giữ allotment phòng cho quý khách trong 30 phút.
              </p>
            </div>

            {/* Booking Code & Lookup Token Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto text-left">
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/50">
                <span className="text-[11px] text-outline font-semibold uppercase block mb-1">
                  Mã Đặt Phòng
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg font-bold text-primary">
                    {confirmedBooking.booking_code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(confirmedBooking.booking_code, 'code')}
                    className="p-1.5 rounded hover:bg-surface-container text-outline hover:text-on-surface transition-colors cursor-pointer"
                    title="Sao chép mã đặt phòng"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {confirmedBooking.lookup_token && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
                  <span className="text-[11px] text-amber-800 font-bold uppercase block mb-1 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-700" /> Mã Tra Cứu Bảo Mật
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-800 truncate mr-2">
                      {confirmedBooking.lookup_token}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(confirmedBooking.lookup_token || '', 'token')}
                      className="p-1.5 rounded hover:bg-amber-100 text-amber-800 transition-colors cursor-pointer shrink-0"
                      title="Sao chép mã tra cứu bảo mật"
                    >
                      {copiedToken ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {confirmedBooking.lookup_token && (
              <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200/60 max-w-xl mx-auto text-center font-medium">
                ⚠️ Quý khách vui lòng sao chép và lưu giữ <strong>Mã Tra Cứu</strong> ở trên. Vì lý do bảo mật quyền riêng tư ẩn danh, mã này chỉ được cấp duy nhất một lần.
              </p>
            )}

            {/* Financial Summary */}
            <div className="p-4 rounded-xl bg-surface-container-low text-left text-xs space-y-2 border border-outline-variant/40 max-w-xl mx-auto">
              <div className="flex justify-between">
                <span className="text-outline">Hạng phòng:</span>
                <span className="font-semibold text-on-surface">{selectedRoom?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Thời gian lưu trú:</span>
                <span className="font-semibold text-on-surface">
                  {checkIn} → {checkOut} ({nights} đêm)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Tổng chi phí phòng:</span>
                <span className="font-bold text-on-surface">{formatVND(confirmedBooking.total_price)}</span>
              </div>
              <div className="flex justify-between border-t border-outline-variant/40 pt-2 text-primary font-bold">
                <span>Số tiền cọc 30% cần thanh toán ngay:</span>
                <span className="text-sm">{formatVND(confirmedBooking.deposit_amount)}</span>
              </div>
              <div className="flex justify-between text-outline text-[11px]">
                <span>70% còn lại thanh toán tại quầy lễ tân:</span>
                <span>{formatVND(confirmedBooking.balance_due)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 max-w-xl mx-auto pt-2">
              {confirmedBooking.checkout_url ? (
                <a
                  href={confirmedBooking.checkout_url}
                  className="flex-1 py-3 px-4 rounded-lg bg-primary text-on-primary hover:bg-[#584323] font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Thanh Toán Cọc 30% Qua Stripe Ngay</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <Link
                  href="/booking/lookup"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-lg bg-primary text-on-primary hover:bg-[#584323] font-bold text-xs uppercase tracking-wider text-center transition-all"
                >
                  Tra Cứu &amp; Thanh Toán Cọc
                </Link>
              )}
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : (
          /* ================= MAIN MINIMALIST BOOKING FLOW ================= */
          <form onSubmit={handleBookingSubmit} className="space-y-5">
            {/* Header */}
            <div className="border-b border-outline-variant/40 pb-3">
              <div className="flex items-center gap-1.5 text-primary mb-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[11px] uppercase tracking-wider font-bold">Đặt Phòng Trực Tuyến</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-on-surface leading-snug">
                {property.name}
              </h2>
              <p className="text-xs text-outline">{property.address}, {property.city}</p>
            </div>

            {errorMessage && (
              <LuxuryAlertBanner
                variant="error"
                title="Lưu Ý"
                description={errorMessage}
                onClose={() => setErrorMessage(null)}
                actionText="Đóng"
                onAction={() => setErrorMessage(null)}
              />
            )}

            {/* Stay Dates (Inline compact row) */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider font-bold text-outline block">
                  Nhận phòng
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-container-lowest border border-outline-variant/60 focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider font-bold text-outline block">
                  Trả phòng ({nights} đêm)
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-container-lowest border border-outline-variant/60 focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Room Selection Cards (Minimalist, No bloated images) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-wider font-bold text-primary block">
                  Chọn Hạng Phòng
                </label>
                <span className="text-[11px] text-outline">Xác nhận tức thì • Giữ allotment</span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {roomTypes.map((room) => {
                  const isSelected = selectedRoomId === room.id;
                  const guestsCount = room.max_guests || 2;
                  return (
                    <div
                      key={room.id}
                      onClick={() => setSelectedRoomId(room.id)}
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
                              <span className="text-[10px] font-bold text-primary bg-primary-container/30 px-1.5 py-0.5 rounded uppercase">
                                Đang chọn
                              </span>
                            )}
                          </div>

                          {/* Fast-scan badge chips */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px] text-on-surface-variant">
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
                          <div className="flex items-center gap-3 text-[11px] text-emerald-800 pt-0.5">
                            <span className="inline-flex items-center gap-1">
                              <Coffee className="w-3 h-3 text-emerald-700" /> Buffet sáng bao gồm
                            </span>
                            <span>•</span>
                            <span>Wifi tốc độ cao</span>
                          </div>
                        </div>

                        {/* Right Price */}
                        <div className="text-right shrink-0 sm:border-l sm:border-outline-variant/30 sm:pl-3">
                          <span className="text-[11px] text-outline block">Mỗi đêm</span>
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

            {/* Guest Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider font-bold text-outline block">
                  Họ &amp; Tên khách
                </label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface-container-low border border-outline-variant/60 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider font-bold text-outline block">
                  Email nhận xác nhận
                </label>
                <input
                  type="email"
                  placeholder="guest@example.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface-container-low border border-outline-variant/60 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider font-bold text-outline block">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  placeholder="0912 345 678"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface-container-low border border-outline-variant/60 focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Optional Add-on Services (Extra Bed, Transfer, etc.) */}
            {services && services.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] uppercase tracking-wider font-bold text-primary block">
                  Dịch vụ tùy chọn
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                          className="w-3.5 h-3.5 text-primary accent-primary"
                        />
                        <span className="font-medium text-on-surface">{srv.name}</span>
                      </div>
                      <span className="font-semibold text-primary">+{formatVND(srv.price)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* 30% Deposit Prominent Summary Card */}
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/50 space-y-2">
              <div className="flex justify-between text-xs text-on-surface-variant">
                <span>Tiền phòng ({nights} đêm):</span>
                <span className="font-semibold text-on-surface">{formatVND(roomSubtotal)}</span>
              </div>
              {addonSubtotal > 0 && (
                <div className="flex justify-between text-xs text-on-surface-variant">
                  <span>Dịch vụ cộng thêm:</span>
                  <span className="font-semibold text-on-surface">+{formatVND(addonSubtotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-bold text-on-surface pt-1 border-t border-outline-variant/40">
                <span>Tổng tiền phòng trọn gói:</span>
                <span>{formatVND(totalPrice)}</span>
              </div>

              {/* 30% Deposit Box */}
              <div className="mt-2 p-2.5 rounded-lg bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
                    Cọc 30% thanh toán ngay (Deposit)
                  </span>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    70% còn lại ({formatVND(balanceDue)}) thanh toán tại quầy lễ tân khi nhận phòng.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-base sm:text-lg font-black text-amber-950">
                    {formatVND(depositAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-outline flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Không cần tạo tài khoản. Cấp mã tra cứu bảo mật tức thì.</span>
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending || checkoutMutation.isPending}
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary hover:bg-[#584323] text-on-primary font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>
                  {createMutation.isPending || checkoutMutation.isPending
                    ? 'Đang kết nối cổng...'
                    : `Thanh Toán Cọc 30% Qua Stripe (${formatVND(depositAmount)})`}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

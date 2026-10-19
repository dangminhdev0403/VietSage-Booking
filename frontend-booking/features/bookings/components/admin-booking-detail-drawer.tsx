'use client';

import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Calendar,
  Building2,
  Phone,
  Mail,
  User,
  CreditCard,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { useBookingsQuery } from '../hooks/use-bookings';
import { luxuryAlert } from '@/lib/alert/luxury-alert';

export type BookingDetailItem = NonNullable<
  ReturnType<typeof useBookingsQuery>['data']
>['items'][number];

interface AdminBookingDetailDrawerProps {
  booking: BookingDetailItem | null;
  onClose: () => void;
  onCancelRequest?: (booking: BookingDetailItem) => void;
}

export function AdminBookingDetailDrawer({
  booking,
  onClose,
  onCancelRequest,
}: AdminBookingDetailDrawerProps) {
  const [copiedCode, setCopiedCode] = useState(false);

  if (!booking) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(booking.booking_code);
      setCopiedCode(true);
      luxuryAlert.toast(`Đã sao chép mã đơn: ${booking.booking_code}`, 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const canCancel =
    booking.status === 'PENDING' &&
    (booking.payment_status === 'UNPAID' || !booking.payment_status);

  const formattedTotalPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(booking.total_price);

  const formattedDeposit = booking.deposit_amount
    ? new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(booking.deposit_amount)
    : null;

  const formattedBalance = booking.balance_due
    ? new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(booking.balance_due)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Centered Rectangular Modal Container */}
      <div className="relative w-full max-w-5xl xl:max-w-6xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* 1. MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-200/80 bg-slate-50/80 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-500">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Chi Tiết Đơn Đặt Phòng
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap pt-0.5">
              <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {booking.booking_code}
              </span>

              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors text-sm font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Sao chép mã đơn"
              >
                {copiedCode ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400" />
                )}
                <span>{copiedCode ? 'Đã sao chép' : 'Sao chép'}</span>
              </button>

              {/* Status Badges */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider border whitespace-nowrap ${
                  booking.status === 'CONFIRMED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : booking.status === 'PENDING'
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : booking.status === 'CHECKED_IN'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : booking.status === 'CANCELLED'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    booking.status === 'CONFIRMED'
                      ? 'bg-emerald-500'
                      : booking.status === 'PENDING'
                      ? 'bg-sky-500'
                      : booking.status === 'CHECKED_IN'
                      ? 'bg-indigo-500'
                      : booking.status === 'CANCELLED'
                      ? 'bg-rose-500'
                      : 'bg-slate-400'
                  }`}
                />
                {booking.status}
              </span>

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap border ${
                  booking.payment_status === 'PAID'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : booking.payment_status === 'REFUNDED'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    booking.payment_status === 'PAID'
                      ? 'bg-emerald-500'
                      : booking.payment_status === 'REFUNDED'
                      ? 'bg-purple-500'
                      : 'bg-amber-500'
                  }`}
                />
                {booking.payment_status === 'PAID'
                  ? 'Đã thanh toán'
                  : booking.payment_status === 'REFUNDED'
                  ? 'Đã hoàn tiền'
                  : 'Chưa thanh toán'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer self-start shrink-0"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. MODAL BODY (Scrollable, Clean 2-Column Balanced Layout) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Top Key Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: Financial Highlight */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  Tổng Chi Phí Lưu Trú
                </span>
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                  {formattedTotalPrice}
                </div>
                {(formattedDeposit || formattedBalance) && (
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    {formattedDeposit && (
                      <span className="text-slate-600 font-medium">
                        Đặt cọc: <strong className="font-mono text-emerald-700">{formattedDeposit}</strong>
                      </span>
                    )}
                    {formattedBalance && (
                      <span className="text-slate-600 font-medium">
                        Tại quầy: <strong className="font-mono text-slate-900">{formattedBalance}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-sm text-slate-500 font-medium">
                <span>Cổng đối soát: Chuyển khoản trực tuyến</span>
                <span className="font-semibold text-slate-700">
                  {new Date(booking.created_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>

            {/* Box 2: Stay Schedule */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  Lịch Trình Lưu Trú
                </span>
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-sm text-slate-500 font-medium">Nhận phòng (Check-in)</span>
                  <div className="text-base sm:text-lg font-bold text-slate-900 font-mono mt-0.5">
                    {booking.check_in}
                  </div>
                  <span className="text-sm text-slate-400">Từ 14:00</span>
                </div>
                <div>
                  <span className="text-sm text-slate-500 font-medium">Trả phòng (Check-out)</span>
                  <div className="text-base sm:text-lg font-bold text-slate-900 font-mono mt-0.5">
                    {booking.check_out}
                  </div>
                  <span className="text-sm text-slate-400">Trước 12:00</span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-sm font-medium">
                <span className="text-slate-500">Thời lượng nghỉ dưỡng</span>
                <span className="font-extrabold text-blue-700 font-mono">
                  {booking.nights} đêm lưu trú
                </span>
              </div>
            </div>
          </div>

          {/* Two-Column Structured Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Column 1: Property & Room */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-3.5 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-2.5">
                <Building2 className="w-4.5 h-4.5 text-blue-600" />
                <span>Cơ Sở Lưu Trú &amp; Hạng Phòng</span>
              </div>

              <div className="space-y-2.5 text-sm sm:text-base">
                <div>
                  <span className="text-sm text-slate-500 font-medium">Tên khách sạn &amp; Resort:</span>
                  <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 text-balance">
                    {booking.property_name || 'Khách sạn đối tác OTA'}
                  </div>
                  {booking.property_address && (
                    <div className="flex items-start gap-1 text-sm text-slate-500 mt-1 font-medium">
                      <MapPin className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                      <span>{booking.property_address}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-sm text-slate-500 font-medium">Hạng phòng:</span>
                  <div className="text-base font-bold text-slate-800 mt-0.5">
                    {booking.room_type_name || 'Hạng phòng tiêu chuẩn'}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-sm text-slate-600 font-medium">
                  <span>Trạng thái phòng</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Đã phân bổ allotment</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2: Guest Details */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-3.5 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-2.5">
                <User className="w-4.5 h-4.5 text-slate-700" />
                <span>Thông Tin Khách Hàng</span>
              </div>

              <div className="space-y-2.5 text-sm sm:text-base">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 font-medium">Họ và tên:</span>
                  <span className="font-bold text-slate-900 text-base sm:text-lg">{booking.guest_name}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 font-medium">Số điện thoại:</span>
                  <a
                    href={`tel:${booking.guest_phone}`}
                    className="font-mono font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5"
                  >
                    <Phone className="w-4 h-4" />
                    <span>{booking.guest_phone}</span>
                  </a>
                </div>

                {booking.guest_email && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 font-medium">Email:</span>
                    <a
                      href={`mailto:${booking.guest_email}`}
                      className="font-medium text-slate-700 hover:text-blue-600 flex items-center gap-1.5 truncate max-w-[200px]"
                    >
                      <Mail className="w-4 h-4 shrink-0 text-slate-400" />
                      <span className="truncate">{booking.guest_email}</span>
                    </a>
                  </div>
                )}

                {booking.special_requests && (
                  <div className="pt-2 border-t border-slate-100 text-sm">
                    <span className="text-slate-500 font-medium">Yêu cầu đặc biệt:</span>
                    <p className="mt-1 p-3 bg-amber-50/80 border border-amber-200/70 rounded-xl text-amber-900 font-medium">
                      {booking.special_requests}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* 3. MODAL FOOTER */}
        <div className="p-4 sm:p-5 border-t border-slate-200/80 bg-slate-50/80 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-sm sm:text-base font-bold transition-colors cursor-pointer"
          >
            Đóng cửa sổ
          </button>

          <div className="flex items-center gap-2.5">
            {canCancel && onCancelRequest && (
              <button
                onClick={() => onCancelRequest(booking)}
                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 text-sm sm:text-base font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Hủy đơn</span>
              </button>
            )}

            <button
              onClick={handleCopyCode}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <span>{copiedCode ? 'Đã sao chép' : 'Sao chép mã đơn'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

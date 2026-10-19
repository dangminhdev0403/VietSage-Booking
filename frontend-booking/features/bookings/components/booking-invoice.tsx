'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Printer,
  Copy,
  Check,
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Bed,
  Calendar,
  Sparkles,
  ExternalLink,
  Info,
} from 'lucide-react';
import { luxuryAlert } from '@/lib/alert/luxury-alert';

export interface BookingInvoiceData {
  id?: string;
  booking_code: string;
  lookup_token?: string;
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
  guests?: number;
  total_price: number;
  deposit_amount?: number;
  balance_due?: number;
  currency?: string;
  status: string;
  payment_status: string;
  assigned_room_number?: string | null;
  created_at?: string;
  paid_at?: string;
  addons?: { service_name: string; price: number }[];
  transaction_ref?: string;
  payment_method?: string;
}

interface BookingInvoiceProps {
  data: BookingInvoiceData;
  onClose?: () => void;
  showCloseButton?: boolean;
  showLookupLink?: boolean;
}

function formatYMDToDMY(ymd: string): string {
  if (!ymd) return '';
  const parts = ymd.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return ymd;
}

function formatStayTimeAndDate(ymd: string, defaultHour: string): string {
  if (!ymd) return '';
  const dateFormatted = formatYMDToDMY(ymd);
  return `${defaultHour}, ${dateFormatted}`;
}

function formatCreatedAt(isoString?: string): string {
  const date = isoString ? new Date(isoString) : new Date();
  if (isNaN(date.getTime())) return '';
  const timePart = date.toLocaleTimeString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const datePart = date.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return `${timePart}, ${datePart}`;
}

export function BookingInvoice({
  data,
  onClose,
  showCloseButton = true,
  showLookupLink = true,
}: BookingInvoiceProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const formatVND = (amount?: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
      amount || 0,
    );

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

  const handlePrint = () => {
    window.print();
  };

  const depositPaid =
    data.payment_status === 'DEPOSIT_PAID' ||
    data.payment_status === 'PAID' ||
    data.status === 'CONFIRMED';
  const effectiveDepositAmount =
    data.deposit_amount ?? Math.round(data.total_price * 0.3);
  const effectiveBalanceDue =
    data.balance_due ?? Math.max(0, data.total_price - effectiveDepositAmount);

  const formattedDate = formatCreatedAt(data.created_at);

  const hasAddons = Boolean(data.addons && data.addons.length > 0);
  const roomBasePrice = hasAddons
    ? data.total_price - (data.addons?.reduce((s, a) => s + a.price, 0) || 0)
    : data.total_price;

  return (
    <div className="text-on-surface flex flex-col justify-between space-y-6">
      {/* Printable Spacious Invoice Container */}
      <div
        id="official-booking-invoice"
        className="bg-surface-container-lowest rounded-3xl border border-outline-variant/50 p-6 sm:p-8 lg:p-10 shadow-sm print:border-none print:shadow-none print:p-0 space-y-6 sm:space-y-8"
      >
        {/* Header: Status + Booking Code */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/40 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight text-balance">
                  {depositPaid ? 'Xác Nhận Đặt Phòng & Đặt Cọc' : 'Hóa Đơn Đặt Phòng'}
                </h2>
                <span className={`px-3.5 py-1 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap border ${
                  depositPaid
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border-amber-200'
                }`}>
                  {depositPaid ? 'Đã Cọc 30%' : 'Chờ Thanh Toán'}
                </span>
              </div>
              <p className="text-sm sm:text-base text-outline font-medium mt-1">
                Ngày tạo: <span className="font-bold text-on-surface">{formattedDate}</span> • Giữ phòng thành công
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-surface-container-low px-5 py-3 rounded-2xl border border-outline-variant/40 self-start sm:self-center shrink-0 shadow-2xs">
            <div className="text-left">
              <span className="text-xs sm:text-sm font-bold text-outline uppercase tracking-wider block">
                Mã Đặt Phòng
              </span>
              <span className="font-mono text-2xl sm:text-3xl font-black text-primary leading-tight tracking-wide">
                {data.booking_code}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(data.booking_code, 'code')}
              className="p-2 hover:bg-surface-container rounded-xl text-outline hover:text-on-surface transition-colors cursor-pointer print:hidden ml-1"
              title="Sao chép mã đặt phòng"
            >
              {copiedCode ? (
                <Check className="w-5 h-5 text-emerald-600" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* 2-Column Split: Left (Stay & Guest) / Right (Financial Breakdown) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* LEFT COLUMN (7 cols): Property, Stay Schedule, Guest Info & Security Token */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
            {/* Property & Room Summary */}
            <div className="p-5 sm:p-6 rounded-2xl bg-surface-container-low/80 border border-outline-variant/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm uppercase tracking-wider font-bold text-primary flex items-center gap-2 whitespace-nowrap">
                  <Sparkles className="w-4 h-4 text-primary" /> Cơ Sở Lưu Trú &amp; Hạng Phòng
                </span>
                <span className="text-xs sm:text-sm font-bold text-primary px-3 py-1 rounded-full bg-primary-container/20 whitespace-nowrap">
                  {data.nights} đêm nghỉ
                </span>
              </div>
              <div className="font-bold text-xl sm:text-2xl text-on-surface leading-tight text-balance">
                {data.property_name}
              </div>
              <div className="flex items-center gap-3 sm:gap-4 text-sm sm:text-base text-outline flex-wrap font-medium pt-0.5">
                <span className="flex items-center gap-2 text-on-surface font-semibold">
                  <Bed className="w-4 h-4 text-primary shrink-0" />
                  {data.room_type_name || 'Phòng nghỉ dưỡng'}
                </span>
                {data.assigned_room_number && depositPaid && (
                  <span className="px-3 py-0.5 rounded-full text-xs sm:text-sm font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                    Phòng {data.assigned_room_number}
                  </span>
                )}
                {data.property_city && (
                  <span className="flex items-center gap-1.5 text-outline">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    {data.property_city}
                  </span>
                )}
              </div>
            </div>

            {/* Stay Dates & Guest Details in 2 spacious subcols */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 text-sm sm:text-base">
              {/* Stay Dates */}
              <div className="p-5 rounded-2xl bg-surface-container-low/70 border border-outline-variant/40 space-y-3">
                <span className="text-xs sm:text-sm uppercase font-bold text-primary flex items-center gap-2 whitespace-nowrap">
                  <Calendar className="w-4 h-4 text-primary" /> Lịch Trình Lưu Trú
                </span>
                <div className="space-y-2 pt-1 text-sm sm:text-base">
                  <div className="flex justify-between items-center py-1.5 border-b border-outline-variant/20">
                    <span className="text-outline font-medium">Nhận phòng:</span>
                    <strong className="text-on-surface font-bold text-right ml-2">
                      {formatStayTimeAndDate(data.check_in, '14:00')}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-outline-variant/20">
                    <span className="text-outline font-medium">Trả phòng:</span>
                    <strong className="text-on-surface font-bold text-right ml-2">
                      {formatStayTimeAndDate(data.check_out, '12:00')}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-outline font-medium">Thời lượng:</span>
                    <strong className="text-on-surface font-bold text-right ml-2">
                      {data.nights} đêm ({formatYMDToDMY(data.check_in)} → {formatYMDToDMY(data.check_out)})
                    </strong>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-outline font-medium">Số lượng:</span>
                    <strong className="text-on-surface font-bold text-right ml-2">
                      {data.guests ?? 2} khách
                    </strong>
                  </div>
                </div>
              </div>

              {/* Guest Info */}
              <div className="p-5 rounded-2xl bg-surface-container-low/70 border border-outline-variant/40 space-y-3">
                <span className="text-xs sm:text-sm uppercase font-bold text-primary flex items-center gap-2 whitespace-nowrap">
                  <User className="w-4 h-4 text-primary" /> Khách Đại Diện
                </span>
                <div className="space-y-2.5 pt-1 text-sm sm:text-base">
                  <div className="py-1 border-b border-outline-variant/20">
                    <span className="text-outline font-medium block text-xs sm:text-sm">Họ và tên:</span>
                    <strong className="font-bold text-on-surface text-base sm:text-lg block truncate mt-0.5">
                      {data.guest_name}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2 py-1 text-sm sm:text-base truncate border-b border-outline-variant/20">
                    <Phone className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-semibold text-on-surface">{data.guest_phone}</span>
                  </div>
                  <div className="flex items-center gap-2 py-1 text-sm sm:text-base truncate">
                    <Mail className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-outline truncate">{data.guest_email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Lookup Token Banner */}
            {data.lookup_token && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
                  <div className="min-w-0">
                    <span className="font-bold text-amber-900 text-xs sm:text-sm uppercase tracking-wider block">
                      Mã Tra Cứu Bảo Mật (Lookup Token)
                    </span>
                    <span className="font-mono text-sm sm:text-base text-amber-950 font-bold block truncate max-w-xs sm:max-w-md pt-0.5" title={data.lookup_token}>
                      {data.lookup_token}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(data.lookup_token || '', 'token')}
                  className="px-4 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 text-sm font-bold hover:bg-amber-100 flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 shadow-2xs print:hidden"
                >
                  {copiedToken ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN (5 cols): Financial Billing Breakdown & Badges */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="rounded-2xl border border-outline-variant/40 overflow-hidden bg-surface-container-low/50 shadow-xs">
              <div className="bg-surface-container-low px-5 py-3.5 font-bold uppercase tracking-wider text-xs sm:text-sm text-outline border-b border-outline-variant/40 flex justify-between items-center">
                <span>Khoản mục thanh toán</span>
                <span>Số tiền</span>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex justify-between items-center text-sm sm:text-base">
                  <span className="text-outline font-medium">Tiền phòng ({data.nights} đêm):</span>
                  <span className="font-bold text-on-surface text-base sm:text-lg">{formatVND(roomBasePrice)}</span>
                </div>

                {hasAddons && (
                  <div className="space-y-2 pt-2 border-t border-outline-variant/30">
                    {data.addons!.map((addon, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm sm:text-base text-outline">
                        <span className="font-medium">+ {addon.service_name}:</span>
                        <span className="font-semibold text-on-surface">{formatVND(addon.price)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-outline-variant/30 font-bold text-base sm:text-lg text-on-surface">
                  <span>Tổng giá trị đơn:</span>
                  <span className="text-xl sm:text-2xl font-black text-primary">{formatVND(data.total_price)}</span>
                </div>

                {/* 30% Deposit Paid (Emerald Card) */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  depositPaid
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm sm:text-base font-bold">
                      <CheckCircle2 className={`w-5 h-5 shrink-0 ${depositPaid ? 'text-emerald-600' : 'text-amber-600'}`} />
                      <span className="uppercase">{depositPaid ? 'ĐÃ CỌC 30% (STRIPE):' : 'CỌC 30% CẦN THANH TOÁN:'}</span>
                    </div>
                    <span className={`font-black text-xl sm:text-2xl ${depositPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {depositPaid ? `-${formatVND(effectiveDepositAmount)}` : formatVND(effectiveDepositAmount)}
                    </span>
                  </div>
                  <span className={`text-xs sm:text-sm font-medium block mt-1 ${depositPaid ? 'text-emerald-800' : 'text-amber-800'}`}>
                    {depositPaid ? 'Thanh toán trực tuyến thành công • Giữ phòng tự động' : 'Chờ hoàn tất thanh toán tiền cọc'}
                  </span>
                </div>

                {/* 70% Balance Due */}
                <div className="p-4 rounded-2xl bg-surface-container-low border border-primary/20 text-on-surface">
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base font-bold text-primary uppercase">
                      70% CÒN LẠI TẠI QUẦY:
                    </span>
                    <span className="font-black text-xl sm:text-2xl text-primary">
                      {formatVND(effectiveBalanceDue)}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm text-outline font-medium block mt-1">
                    Thanh toán khi làm thủ tục nhận phòng (Check-in)
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Hospitality Note */}
            <div className="text-sm text-outline font-medium bg-surface-container-low/50 p-4 rounded-2xl border border-outline-variant/30 flex items-start gap-3 leading-relaxed">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span>
                Quý khách vui lòng xuất trình <strong>CCCD/Hộ chiếu</strong> khi làm thủ tục nhận phòng tại quầy lễ tân khách sạn.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Bar (Sticky at bottom) */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden pt-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-3 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-2xs border border-outline-variant/40"
          >
            <Printer className="w-4 h-4 text-primary" />
            <span>In / Lưu PDF</span>
          </button>

          {showLookupLink && (
            <Link
              href={`/booking/lookup?code=${encodeURIComponent(data.booking_code)}${data.lookup_token ? `&token=${encodeURIComponent(data.lookup_token)}` : ''}`}
              className="px-5 py-3 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition-all shadow-2xs border border-outline-variant/40"
            >
              <ExternalLink className="w-4 h-4 text-primary" />
              <span>Trang Tra Cứu</span>
            </Link>
          )}
        </div>

        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3 rounded-xl bg-primary hover:bg-[#584323] text-on-primary font-bold text-sm uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-[0.99]"
          >
            Hoàn Tất &amp; Đóng
          </button>
        )}
      </div>
    </div>
  );
}

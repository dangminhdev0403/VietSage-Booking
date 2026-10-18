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

  const formattedDate = data.created_at
    ? new Date(data.created_at).toLocaleDateString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

  const hasAddons = Boolean(data.addons && data.addons.length > 0);
  const roomBasePrice = hasAddons
    ? data.total_price - (data.addons?.reduce((s, a) => s + a.price, 0) || 0)
    : data.total_price;

  return (
    <div className="text-on-surface flex flex-col justify-between space-y-4">
      {/* Printable Invoice Container */}
      <div
        id="official-booking-invoice"
        className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-4 sm:p-6 shadow-xs print:border-none print:shadow-none print:p-0 space-y-4"
      >
        {/* Header: Status + Booking Code */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/40 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
                  {depositPaid ? 'Xác Nhận Đặt Phòng & Đặt Cọc' : 'Hóa Đơn Đặt Phòng'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {depositPaid ? 'Đã Cọc 30%' : 'Chờ Thanh Toán'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-outline font-medium mt-0.5">
                Ngày tạo: <span className="font-semibold text-on-surface">{formattedDate}</span> • Giữ phòng thành công
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-surface-container-low px-3.5 py-2 rounded-xl border border-outline-variant/40 self-start sm:self-center shrink-0">
            <div className="text-left">
              <span className="text-xs font-bold text-outline uppercase tracking-wider block">
                Mã Đặt Phòng
              </span>
              <span className="font-mono text-lg sm:text-xl font-black text-primary leading-tight">
                {data.booking_code}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(data.booking_code, 'code')}
              className="p-1.5 hover:bg-surface-container rounded-lg text-outline hover:text-on-surface transition-colors cursor-pointer print:hidden ml-1"
              title="Sao chép mã đặt phòng"
            >
              {copiedCode ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* 2-Column Split: Left (Stay & Guest) / Right (Financial Breakdown) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
          {/* LEFT COLUMN (7 cols): Property, Stay Schedule, Guest Info & Security Token */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-3">
            {/* Property & Room Summary */}
            <div className="p-3.5 rounded-xl bg-surface-container-low/70 border border-outline-variant/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-bold text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Cơ Sở Lưu Trú &amp; Hạng Phòng
                </span>
                <span className="text-xs font-bold text-primary px-2.5 py-0.5 rounded-md bg-primary-container/20">
                  {data.nights} đêm nghỉ
                </span>
              </div>
              <div className="font-bold text-base sm:text-lg text-on-surface leading-snug">
                {data.property_name}
              </div>
              <div className="flex items-center gap-3 text-sm text-outline flex-wrap">
                <span className="flex items-center gap-1.5 text-on-surface font-semibold">
                  <Bed className="w-4 h-4 text-primary" />
                  {data.room_type_name || 'Phòng nghỉ dưỡng'}
                </span>
                {data.property_city && (
                  <span className="flex items-center gap-1 text-outline">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    {data.property_city}
                  </span>
                )}
              </div>
            </div>

            {/* Stay Dates & Guest Details in 2-subcols */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
              {/* Dates */}
              <div className="p-3 rounded-xl bg-surface-container-low/70 border border-outline-variant/40 space-y-1.5">
                <span className="text-xs uppercase font-bold text-outline flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" /> Lịch Trình Lưu Trú
                </span>
                <div className="flex justify-between items-center text-xs sm:text-sm pt-0.5">
                  <span className="text-outline">Nhận phòng:</span>
                  <strong className="text-on-surface">{data.check_in} (14h)</strong>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-outline">Trả phòng:</span>
                  <strong className="text-on-surface">{data.check_out} (12h)</strong>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-outline">Số lượng:</span>
                  <strong className="text-on-surface">{data.guests ?? 2} khách</strong>
                </div>
              </div>

              {/* Guest Info */}
              <div className="p-3 rounded-xl bg-surface-container-low/70 border border-outline-variant/40 space-y-1.5">
                <span className="text-xs uppercase font-bold text-outline flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" /> Khách Đại Diện
                </span>
                <div className="font-bold text-on-surface text-sm sm:text-base truncate pt-0.5">
                  {data.guest_name}
                </div>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-outline truncate">
                  <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="font-medium text-on-surface">{data.guest_phone}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-outline truncate">
                  <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">{data.guest_email}</span>
                </div>
              </div>
            </div>

            {/* Security Lookup Token Banner */}
            {data.lookup_token && (
              <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200/90 flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold text-amber-900 text-xs sm:text-sm block">
                      Mã Tra Cứu Bảo Mật (Lookup Token)
                    </span>
                    <span className="font-mono text-xs sm:text-sm text-amber-950 font-semibold block truncate max-w-[200px] sm:max-w-xs" title={data.lookup_token}>
                      {data.lookup_token}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(data.lookup_token || '', 'token')}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs print:hidden"
                >
                  {copiedToken ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN (5 cols): Financial Billing Breakdown & Badges */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-2.5">
            <div className="rounded-xl border border-outline-variant/40 overflow-hidden text-sm bg-surface-container-low/40">
              <div className="bg-surface-container-low px-3.5 py-2 font-bold uppercase tracking-wider text-xs text-outline border-b border-outline-variant/40 flex justify-between">
                <span>Khoản mục thanh toán</span>
                <span>Số tiền</span>
              </div>

              <div className="p-3.5 space-y-2.5">
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-outline">Tiền phòng ({data.nights} đêm):</span>
                  <span className="font-semibold text-on-surface">{formatVND(roomBasePrice)}</span>
                </div>

                {hasAddons && (
                  <div className="space-y-1.5 pt-1 border-t border-outline-variant/30">
                    {data.addons!.map((addon, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs text-outline">
                        <span>+ {addon.service_name}:</span>
                        <span className="font-medium text-on-surface">{formatVND(addon.price)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-outline-variant/30 font-bold text-sm text-on-surface">
                  <span>Tổng giá trị đơn:</span>
                  <span className="text-base font-black">{formatVND(data.total_price)}</span>
                </div>

                {/* 30% Deposit Paid (Emerald Card) */}
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>ĐÃ CỌC 30% (STRIPE):</span>
                    </div>
                    <span className="font-black text-base sm:text-lg text-emerald-700">
                      -{formatVND(effectiveDepositAmount)}
                    </span>
                  </div>
                  <span className="text-xs text-emerald-800 block mt-0.5">
                    Thanh toán trực tuyến thành công
                  </span>
                </div>

                {/* 70% Balance Due */}
                <div className="p-2.5 rounded-xl bg-surface-container-low border border-primary/20 text-on-surface">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-primary">
                      70% CÒN LẠI TẠI QUẦY:
                    </span>
                    <span className="font-black text-base sm:text-lg text-primary">
                      {formatVND(effectiveBalanceDue)}
                    </span>
                  </div>
                  <span className="text-xs text-outline block mt-0.5">
                    Thanh toán khi làm thủ tục nhận phòng
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Hospitality Note */}
            <div className="text-xs text-outline bg-surface-container-low/40 p-2.5 rounded-lg border border-outline-variant/30 flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                Quý khách vui lòng xuất trình <strong>CCCD/Hộ chiếu</strong> khi làm thủ tục nhận phòng tại quầy lễ tân.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Bar (Sticky at bottom) */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden pt-0.5">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-2xs border border-outline-variant/40"
          >
            <Printer className="w-4 h-4 text-primary" />
            <span>In / Lưu PDF</span>
          </button>

          {showLookupLink && (
            <Link
              href={`/booking/lookup?code=${encodeURIComponent(data.booking_code)}${data.lookup_token ? `&token=${encodeURIComponent(data.lookup_token)}` : ''}`}
              className="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition-all shadow-2xs border border-outline-variant/40"
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
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-[#584323] text-on-primary font-bold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer shadow-sm"
          >
            Hoàn Tất &amp; Đóng
          </button>
        )}
      </div>
    </div>
  );
}

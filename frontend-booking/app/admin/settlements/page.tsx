'use client';

import React from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  BadgeDollarSign,
} from 'lucide-react';

export default function AdminSettlementsPage() {
  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
      {/* 1. HEADER */}
      <div className="flex flex-col gap-2 pb-2">
        <div className="flex items-center gap-1.5 text-outline text-xs font-bold uppercase tracking-widest">
          <span>Financial Operations</span>
          <span className="text-outline-variant">•</span>
          <span className="text-primary font-extrabold">Partner Settlements &amp; Commission</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
          Quyết Toán &amp; Đối Soát Doanh Thu Đối Tác
        </h1>
        <p className="text-xs sm:text-base text-on-surface-variant max-w-2xl leading-relaxed">
          Quản lý chu kỳ thanh toán, tỷ lệ hoa hồng đại lý và biên bản đối soát doanh thu với các cơ sở lưu trú đối tác.
        </p>
      </div>

      {/* 2. PLANNED SURFACE CARD (TRUTHFUL & ZERO NETWORK CALLS) */}
      <div className="bg-surface-container-lowest rounded-3xl p-8 sm:p-12 border border-outline-variant/30 shadow-2xs text-center max-w-3xl mx-auto space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
          <Clock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Tính Năng Đang Được Phát Triển</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
            Module Quyết Toán Doanh Thu Đang Xây Dựng
          </h2>

          <p className="text-xs sm:text-sm text-outline max-w-lg mx-auto leading-relaxed">
            Hệ thống đối soát doanh thu tự động theo chu kỳ (Settlement Cycles) và tính toán hoa hồng phân phối OTA đang được phát triển theo lộ trình kỹ thuật. Toàn bộ dòng tiền hiện tại được đối soát qua báo cáo thanh toán trực tiếp.
          </p>
        </div>

        {/* Feature roadmap preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
              <BadgeDollarSign className="w-4 h-4 shrink-0" />
              <span>Chu Kỳ Đối Soát (Cycles)</span>
            </div>
            <p className="text-xs text-outline leading-snug">
              Tự động chốt số liệu theo tuần hoặc tháng sau khi khách check-out hoàn tất.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1.5">
            <div className="flex items-center gap-2 text-primary font-bold text-xs">
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>Biên Bản Đối Soát (Statements)</span>
            </div>
            <p className="text-xs text-outline leading-snug">
              Xuất biên bản chi tiết phí dịch vụ, tiền cọc đã giữ và số tiền cần chuyển giao.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1.5">
            <div className="flex items-center gap-2 text-primary font-bold text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Tách Dòng Tiền (Payouts)</span>
            </div>
            <p className="text-xs text-outline leading-snug">
              Kết nối lệnh chuyển khoản tự động qua tài khoản thụ hưởng của khách sạn đối tác.
            </p>
          </div>
        </div>

        {/* Action shortcuts */}
        <div className="pt-4 flex items-center justify-center gap-3">
          <Link
            href="/admin/payments"
            className="px-5 py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Xem Lịch Sử Thanh Toán</span>
          </Link>

          <Link
            href="/admin/bookings"
            className="px-5 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Quản Lý Đơn Đặt Phòng</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

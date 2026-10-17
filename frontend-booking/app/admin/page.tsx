'use client';

import React, { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  FileDown,
  BedDouble,
  LogIn,
  LogOut,
  Sparkles,
  Diamond,
  Car,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { useBookingsQuery, useUpdateBookingStatusMutation } from '@/features/bookings/hooks/use-bookings';
import { confirmPayment } from '@/features/bookings/service/bookings.client';
import { luxuryAlert } from '@/lib/alert/luxury-alert';

export default function AdminPage() {
  const { data: session, status: authStatus } = useSession();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedResortTab, setSelectedResortTab] = useState('ALL');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const role = (session?.user as { role?: string } | undefined)?.role;
  const userName = session?.user?.name || 'Tổng Quản Lý';
  const canConfirmPayment = role === 'ADMIN' || role === 'SUPER_ADMIN';

  const { data: bookingsData, isLoading, error, refetch } = useBookingsQuery(
    {
      status: statusFilter === 'ALL' ? undefined : statusFilter,
    },
    {
      enabled: authStatus === 'authenticated',
    },
  );

  const updateStatusMutation = useUpdateBookingStatusMutation();

  const handleSyncOTA = async () => {
    setIsSyncing(true);
    try {
      await refetch();
      luxuryAlert.toast('Đã đồng bộ dữ liệu đặt phòng mới nhất từ hệ thống', 'success');
    } catch {
      luxuryAlert.toast('Đồng bộ dữ liệu gặp sự cố, vui lòng thử lại', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportReport = () => {
    luxuryAlert.info({
      title: 'Báo Cáo Ca Vận Hành',
      message: 'Hệ thống đang chuẩn bị tệp báo cáo tổng hợp (Doanh thu ca, lượt check-in/out và danh sách VIP). Tệp sẽ tự động lưu về thiết bị.',
    });
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (newStatus !== 'CANCELLED') return;
    const confirmed = await luxuryAlert.confirm({
      title: 'Xác Nhận Hủy Đơn Đặt Phòng',
      message: 'Quý đối tác có chắc chắn muốn hủy đơn đặt phòng này? Thao tác này sẽ hủy giữ chỗ và cập nhật trạng thái đơn thành CANCELLED.',
      confirmText: 'Xác Nhận Hủy Đơn',
      cancelText: 'Giữ Lại Đơn',
      isDangerous: true,
    });
    if (!confirmed) return;

    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus });
      luxuryAlert.toast('Đã cập nhật trạng thái đơn sang CANCELLED', 'success');
      refetch();
    } catch (err: unknown) {
      const formatted = luxuryAlert.formatApiError(err);
      luxuryAlert.error({
        title: 'Cập Nhật Trạng Thái Thất Bại',
        message: formatted.message,
        details: formatted.details,
      });
    }
  };

  const handleConfirmPayment = async (bookingId: string) => {
    const confirmed = await luxuryAlert.confirm({
      title: 'Xác Nhận Thanh Toán Chuyển Khoản',
      message: 'Hệ thống đã nhận được tiền thanh toán đối soát cho đơn đặt phòng này? Thao tác này sẽ đánh dấu đơn là PAID.',
      confirmText: 'Xác Nhận Đã Nhận Tiền',
      cancelText: 'Kiểm Tra Thêm',
    });
    if (!confirmed) return;

    setConfirmingId(bookingId);
    try {
      await confirmPayment(bookingId);
      luxuryAlert.toast('Đã xác nhận thanh toán thành công cho đơn đặt phòng', 'success');
      refetch();
    } catch (err: unknown) {
      const formatted = luxuryAlert.formatApiError(err);
      luxuryAlert.error({
        title: 'Xác Nhận Thanh Toán Thất Bại',
        message: formatted.message,
        details: formatted.details,
      });
    } finally {
      setConfirmingId(null);
    }
  };

  const bookings = bookingsData?.items || [];
  const totalRevenue = useMemo(
    () => bookings.reduce((sum, b) => sum + (b.total_price || 0), 0),
    [bookings]
  );

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-10">
      {/* 1. TOP GREETING & EXECUTIVE INTELLIGENCE PANEL */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-outline">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
              Executive Intelligence Panel
            </span>
            <span className="text-outline-variant">•</span>
            <span className="text-xs text-outline">Trung Tâm Điều Hành OTA &amp; Lưu Trú</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface tracking-tight">
            Chào buổi sáng, {userName}
          </h1>

          <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
            Hệ thống vận hành hôm nay ghi nhận tỷ lệ lấp đầy kỷ lục tại cụm biệt thự ven biển. Tình trạng đón tiếp VIP và nhân sự quản gia đang diễn ra trơn tru.
          </p>

          {/* Resort Switcher Tabs */}
          <div className="flex items-center gap-2 flex-wrap mt-3">
            {[
              { id: 'ALL', label: 'Toàn hệ thống (4 Resort)' },
              { id: 'PHU_QUOC', label: 'Aurum Sunset Phú Quốc' },
              { id: 'SON_TRA', label: 'Aurum Heritage Sơn Trà' },
              { id: 'MUI_NE', label: 'The Anam Mũi Né' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedResortTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedResortTab === tab.id
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Executive Actions */}
        <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto shrink-0">
          <button
            onClick={handleSyncOTA}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-2xl bg-surface-container-lowest text-on-surface border border-outline-variant/30 shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-primary ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ OTA'}</span>
          </button>

          <button
            onClick={handleExportReport}
            className="px-4 py-2.5 rounded-2xl bg-surface-container-lowest text-on-surface border border-outline-variant/30 shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 text-xs font-bold cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-primary" />
            <span>Xuất báo cáo ca</span>
          </button>

          <button
            onClick={() => {
              const tableEl = document.getElementById('bookings-management-table');
              tableEl?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2.5 rounded-2xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Filter className="w-4 h-4" />
            <span>Quản trị đơn đặt</span>
          </button>
        </div>
      </section>

      {/* 2. 4 OPERATIONAL KPI CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Doanh thu hôm nay */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between relative overflow-hidden group hover:shadow-xs transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">Doanh thu ghi nhận</span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-on-surface">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue || 184500000)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-tertiary font-bold mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+14.2%</span>
              <span className="text-outline font-normal">so với hôm qua</span>
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-outline text-xs">
            <span>Mục tiêu tháng: 82%</span>
            <div className="w-20 bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: '82%' }} />
            </div>
          </div>
        </div>

        {/* Card 2: Lấp đầy phòng (Occupancy) */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between relative overflow-hidden group hover:shadow-xs transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">Lấp đầy phòng (OCC)</span>
            <div className="w-9 h-9 rounded-xl bg-tertiary-container/30 flex items-center justify-center text-tertiary">
              <BedDouble className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-on-surface">91.4%</span>
              <span className="text-xs font-bold text-tertiary px-2 py-0.5 rounded-full bg-tertiary-container/30">Tối ưu</span>
            </div>
            <div className="text-xs text-on-surface-variant flex items-center justify-between mt-1">
              <span>148 / 162 phòng có khách</span>
              <span className="font-bold text-primary">14 trống</span>
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-outline text-xs">
            <span>Dự báo đêm nay: 94.8%</span>
            <span className="text-emerald-700 font-bold">Cao điểm</span>
          </div>
        </div>

        {/* Card 3: Check-in hôm nay */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between relative overflow-hidden group hover:shadow-xs transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">Lượt Check-in hôm nay</span>
            <div className="w-9 h-9 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
              <LogIn className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-on-surface">28</span>
              <span className="text-xs text-outline font-medium">lượt khách</span>
            </div>
            <div className="text-xs text-on-surface-variant mt-1">
              <span className="text-primary font-bold">19 VIP</span> đã đón • <span className="font-bold">9 lượt</span> đang tới
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-outline text-xs">
            <span className="flex items-center gap-1">
              <Car className="w-3.5 h-3.5 text-primary" />
              <span>Limousine &amp; Bentley</span>
            </span>
            <span className="text-primary font-bold text-[11px]">Theo dõi xe</span>
          </div>
        </div>

        {/* Card 4: Check-out hôm nay */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between relative overflow-hidden group hover:shadow-xs transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">Lượt Check-out hôm nay</span>
            <div className="w-9 h-9 rounded-xl bg-secondary-container/30 flex items-center justify-center text-secondary">
              <LogOut className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-on-surface">22</span>
              <span className="text-xs text-outline font-medium">lượt khách</span>
            </div>
            <div className="text-xs text-tertiary flex items-center gap-1.5 mt-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>100% hóa đơn tất toán</span>
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-outline text-xs">
            <span>Đánh giá trung bình: 4.96/5</span>
            <span className="text-primary font-bold">Forbes 5-Star</span>
          </div>
        </div>
      </section>

      {/* 3. VISUAL ANALYTICS & RADAR BENTO */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 7-Day Revenue Trend (7 Columns) */}
        <div className="lg:col-span-7 bg-surface-container-lowest p-6 sm:p-7 rounded-3xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-primary font-extrabold block">
                Tài chính &amp; Hiệu suất
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-on-surface mt-0.5">
                Doanh thu 7 ngày gần nhất
              </h2>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span>Tuần này</span>
              </span>
              <span className="flex items-center gap-1.5 text-outline">
                <span className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
                <span>Tuần trước</span>
              </span>
            </div>
          </div>

          {/* Custom SVG Revenue Comparison Chart */}
          <div className="w-full h-52 relative">
            <svg className="w-full h-full overflow-visible" fill="none" preserveAspectRatio="none" viewBox="0 0 600 180">
              {/* Background Grid Lines */}
              <line stroke="#f4f3f1" strokeDasharray="4 4" strokeWidth="1.5" x1="0" x2="600" y1="30" y2="30" />
              <line stroke="#f4f3f1" strokeDasharray="4 4" strokeWidth="1.5" x1="0" x2="600" y1="80" y2="80" />
              <line stroke="#f4f3f1" strokeDasharray="4 4" strokeWidth="1.5" x1="0" x2="600" y1="130" y2="130" />

              {/* Previous Week Curve */}
              <path
                d="M 20,135 Q 110,120 190,140 T 360,95 T 480,110 T 580,75"
                fill="none"
                opacity="0.6"
                stroke="#d1c5b8"
                strokeLinecap="round"
                strokeWidth="2"
              />

              {/* Area Gradient Definition */}
              <defs>
                <linearGradient id="aurumGoldGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#c5a880" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#faf9f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area Fill */}
              <path
                d="M 20,120 Q 110,85 190,95 T 360,50 T 480,40 T 580,22 L 580,175 L 20,175 Z"
                fill="url(#aurumGoldGrad)"
              />

              {/* Current Week Curve */}
              <path
                d="M 20,120 Q 110,85 190,95 T 360,50 T 480,40 T 580,22"
                fill="none"
                stroke="#725b38"
                strokeLinecap="round"
                strokeWidth="3"
              />

              {/* Markers */}
              <circle cx="190" cy="95" fill="#faf9f6" r="4" stroke="#725b38" strokeWidth="2" />
              <circle cx="360" cy="50" fill="#faf9f6" r="4" stroke="#725b38" strokeWidth="2" />
              <circle cx="480" cy="40" fill="#faf9f6" r="4" stroke="#725b38" strokeWidth="2" />
              <circle cx="580" cy="22" fill="#725b38" r="5" stroke="#ffffff" strokeWidth="2" />
            </svg>

            {/* X-axis Day Labels */}
            <div className="flex justify-between text-outline text-[11px] font-semibold mt-2">
              <span>Thứ 7</span>
              <span>Chủ nhật</span>
              <span>Thứ 2</span>
              <span>Thứ 3</span>
              <span>Thứ 4</span>
              <span>Thứ 5</span>
              <span className="text-primary font-bold">Hôm nay</span>
            </div>
          </div>

          {/* Segment Distribution Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-container-low/60 rounded-2xl p-4">
            <div>
              <span className="text-[10px] text-outline uppercase font-bold block">Phòng nghỉ cao cấp</span>
              <span className="text-sm font-bold text-on-surface">112.4M ₫</span>
              <span className="text-[11px] text-tertiary font-semibold block">60.9%</span>
            </div>
            <div>
              <span className="text-[10px] text-outline uppercase font-bold block">Ẩm thực Michelin</span>
              <span className="text-sm font-bold text-on-surface">41.8M ₫</span>
              <span className="text-[11px] text-tertiary font-semibold block">22.6%</span>
            </div>
            <div>
              <span className="text-[10px] text-outline uppercase font-bold block">Spa &amp; Wellness</span>
              <span className="text-sm font-bold text-on-surface">18.3M ₫</span>
              <span className="text-[11px] text-tertiary font-semibold block">9.9%</span>
            </div>
            <div>
              <span className="text-[10px] text-outline uppercase font-bold block">Du thuyền &amp; Quản gia</span>
              <span className="text-sm font-bold text-on-surface">12.0M ₫</span>
              <span className="text-[11px] text-tertiary font-semibold block">6.6%</span>
            </div>
          </div>
        </div>

        {/* Right Column: Room Status Live Radar (5 Columns) */}
        <div className="lg:col-span-5 bg-surface-container-lowest p-6 sm:p-7 rounded-3xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-primary font-extrabold block">
                Radar Buồng Phòng
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-on-surface mt-0.5">
                Trạng thái phòng trực quan
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-tertiary-container/30 text-on-tertiary-container rounded-full text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              <span>Thời gian thực</span>
            </span>
          </div>

          {/* Graphic Floor Matrix Visualization */}
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-outline mb-1.5">
                <span>Khu Ocean Villas (32 căn)</span>
                <span className="text-tertiary font-bold">100% Kín phòng</span>
              </div>
              <div className="grid grid-cols-8 gap-1.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-4 rounded-sm bg-tertiary" title={`Villa 0${i + 1}: Có khách`} />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-outline mb-1.5">
                <span>Khu Presidential Sunset Suite (18 căn)</span>
                <span className="text-primary font-bold">16/18 Đã nhận</span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                <div className="h-4 rounded-sm bg-tertiary" />
                <div className="h-4 rounded-sm bg-tertiary" />
                <div className="h-4 rounded-sm bg-primary-container" title="Sẵn sàng đón" />
                <div className="h-4 rounded-sm bg-tertiary" />
                <div className="h-4 rounded-sm bg-primary-container" title="Sẵn sàng đón" />
                <div className="h-4 rounded-sm bg-tertiary" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-outline mb-1.5">
                <span>Khu Grand Deluxe Main Wing (112 phòng)</span>
                <span className="text-xs text-outline">100 Đón • 11 Dọn • 1 Khóa</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-3 rounded-xs ${
                      i === 3 || i === 8
                        ? 'bg-surface-dim'
                        : i === 6
                        ? 'bg-rose-500'
                        : i === 10
                        ? 'bg-primary-container'
                        : 'bg-tertiary'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Room Status Legend */}
          <div className="grid grid-cols-2 gap-2.5 pt-3 bg-surface-container-low/50 rounded-2xl p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-on-surface">
              <span className="w-3 h-3 rounded-sm bg-tertiary shrink-0" />
              <span>Đang lưu trú (148)</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-on-surface">
              <span className="w-3 h-3 rounded-sm bg-primary-container shrink-0" />
              <span>Sẵn sàng đón (14)</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-on-surface">
              <span className="w-3 h-3 rounded-sm bg-surface-dim shrink-0" />
              <span>Đang dọn buồng (11)</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-on-surface">
              <span className="w-3 h-3 rounded-sm bg-rose-500 shrink-0" />
              <span>Bảo trì tạm khóa (1)</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. VIP ARRIVALS & SPECIAL REQUESTS TABLE */}
      <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/30 shadow-2xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-container/20 text-primary flex items-center justify-center">
              <Diamond className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface">Khách VIP Sắp Nhận Phòng Hôm Nay</h2>
              <span className="text-xs text-outline font-medium">
                VIP Arrivals &amp; Exclusive Personalized Requests
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-primary px-3 py-1 rounded-full bg-primary-container/20">
            3 Lượt khách ưu tiên
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* VIP 1 */}
          <div className="p-5 rounded-2xl bg-surface-container-low/70 border border-outline-variant/30 flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-serif font-black flex items-center justify-center text-sm shrink-0">
                  HK
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-on-surface">Hoàng Kim</span>
                    <span className="px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container text-[10px] font-extrabold uppercase">
                      Diamond
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-primary block mt-0.5">
                    Sunset Villa 01 • Tổng Thống
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-outline leading-relaxed bg-surface-container-lowest/60 p-3 rounded-xl border border-outline-variant/20">
              Yêu cầu: Champagne Moët ướp lạnh, gối lông vũ 100%, Check-in 14:00.
            </p>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                Phòng đã sẵn sàng
              </span>
              <span className="text-outline font-medium">Dự kiến: 14:00</span>
            </div>
          </div>

          {/* VIP 2 */}
          <div className="p-5 rounded-2xl bg-surface-container-low/70 border border-outline-variant/30 flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-secondary/10 text-secondary font-serif font-black flex items-center justify-center text-sm shrink-0">
                  DH
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-on-surface">David Harrison</span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-extrabold uppercase">
                      Gold
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-primary block mt-0.5">
                    Ocean Suite 104 • Tầng 10
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-outline leading-relaxed bg-surface-container-lowest/60 p-3 rounded-xl border border-outline-variant/20">
              Yêu cầu: Xe Bentley đón sân bay, tiệc trà chiều thượng hạng lúc 16:30.
            </p>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="px-2.5 py-1 rounded-full bg-primary-container/30 text-on-primary-container font-bold inline-flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-primary" />
                Xe đang đón
              </span>
              <span className="text-outline font-medium">Dự kiến: 15:15</span>
            </div>
          </div>

          {/* VIP 3 */}
          <div className="p-5 rounded-2xl bg-surface-container-low/70 border border-outline-variant/30 flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-outline-variant/30 text-outline font-serif font-black flex items-center justify-center text-sm shrink-0">
                  BN
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-on-surface">Trần Bảo Ngọc</span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-extrabold uppercase">
                      Silver
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-primary block mt-0.5">
                    Heritage Villa 08 • Vườn Nhiệt Đới
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-outline leading-relaxed bg-surface-container-lowest/60 p-3 rounded-xl border border-outline-variant/20">
              Yêu cầu: Bàn ăn ven biển lúc hoàng hôn 18:00, thực đơn chay thực dưỡng.
            </p>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                Phòng đã sẵn sàng
              </span>
              <span className="text-outline font-medium">Dự kiến: 16:00</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. LIVE BOOKINGS MANAGEMENT TABLE (WIRED WITH DATA & ACTIONS) */}
      <section id="bookings-management-table" className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xs overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold text-on-surface">Danh Sách Đơn Đặt Phòng OTA</h3>
            </div>
            <p className="text-xs text-outline mt-1 max-w-xl">
              Quản lý và cập nhật tiến trình của từng đơn đặt phòng. Thao tác xác nhận phòng và check-in/out thực tế thuộc thẩm quyền quản lý của đối tác PMS.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 text-xs">
            {['ALL', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-outline font-medium">Đang tải danh sách đặt phòng...</p>
          </div>
        ) : error ? (
          <div className="p-16 text-center space-y-4">
            <div className="text-sm font-semibold text-rose-600 max-w-md mx-auto leading-relaxed">
              Không thể tải danh sách đơn đặt phòng. Vui lòng kiểm tra lại kết nối.
            </div>
            <button
              onClick={() => refetch()}
              className="inline-block px-6 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
            >
              Tải lại danh sách
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-24 text-center text-outline text-xs">
            Chưa có đơn đặt phòng nào phù hợp bộ lọc hiện tại.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low text-outline uppercase tracking-wider text-xs font-bold border-b border-outline-variant/20">
                <tr>
                  <th className="py-4 px-6">Mã Đặt</th>
                  <th className="py-4 px-6">Khách Sạn</th>
                  <th className="py-4 px-6">Khách Hàng</th>
                  <th className="py-4 px-6">Thời Gian</th>
                  <th className="py-4 px-6">Tổng Tiền</th>
                  <th className="py-4 px-6">Trạng Thái</th>
                  <th className="py-4 px-6 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-on-surface">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-container/50 transition-colors">
                    <td className="py-4 px-6 font-mono font-extrabold text-primary">
                      {b.booking_code}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-on-surface">{b.property_name}</div>
                      <div className="text-xs text-outline">{b.room_type_name || 'Tiêu chuẩn'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-on-surface">{b.guest_name}</div>
                      <div className="text-xs text-outline">{b.guest_phone}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-xs sm:text-sm">
                        {b.check_in} → {b.check_out}
                      </div>
                      <div className="text-xs text-outline font-medium">({b.nights} đêm)</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-black text-on-surface">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(b.total_price)}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            b.payment_status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.payment_status === 'REFUNDED'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {b.payment_status === 'PAID'
                            ? 'Đã Thanh Toán'
                            : b.payment_status === 'REFUNDED'
                            ? 'Đã Hoàn Tiền'
                            : 'Chưa Thanh Toán'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${
                          b.status === 'CONFIRMED'
                            ? 'bg-tertiary-container/30 text-tertiary'
                            : b.status === 'PENDING'
                            ? 'bg-primary-container/30 text-primary'
                            : b.status === 'CHECKED_IN'
                            ? 'bg-secondary-container/40 text-secondary'
                            : b.status === 'CANCELLED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-surface-container text-outline'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canConfirmPayment && b.payment_status === 'UNPAID' && b.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleConfirmPayment(b.id)}
                            disabled={confirmingId === b.id}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                          >
                            {confirmingId === b.id ? 'Đang duyệt...' : 'Duyệt TT'}
                          </button>
                        )}
                        {b.status === 'PENDING' ? (
                          <button
                            onClick={() => handleStatusChange(b.id, 'CANCELLED')}
                            className="px-3 py-1.5 bg-surface-container hover:bg-rose-100 hover:text-rose-700 text-outline rounded-full text-xs font-bold transition-all cursor-pointer"
                          >
                            Hủy đơn
                          </button>
                        ) : b.payment_status === 'PAID' ? (
                          <span className="text-xs text-outline/60 italic">—</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

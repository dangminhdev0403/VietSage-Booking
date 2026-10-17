'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Filter,
  CheckCircle2,
  Clock,
  CreditCard,
  Building2,
  CalendarDays,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { useBookingsQuery, useUpdateBookingStatusMutation } from '@/features/bookings/hooks/use-bookings';
import { confirmPayment } from '@/features/bookings/service/bookings.client';
import { luxuryAlert } from '@/lib/alert/luxury-alert';

export default function AdminPage() {
  const { data: session, status: authStatus } = useSession();
  const [statusFilter, setStatusFilter] = useState('ALL');
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

  const confirmedCount = useMemo(
    () => bookings.filter((b) => b.status === 'CONFIRMED' || b.payment_status === 'PAID').length,
    [bookings]
  );

  const pendingCount = useMemo(
    () => bookings.filter((b) => b.status === 'PENDING' || b.payment_status === 'UNPAID').length,
    [bookings]
  );

  const paidCount = useMemo(
    () => bookings.filter((b) => b.payment_status === 'PAID').length,
    [bookings]
  );

  const avgBookingValue = useMemo(() => {
    if (bookings.length === 0) return 0;
    return Math.round(totalRevenue / bookings.length);
  }, [totalRevenue, bookings.length]);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-10">
      {/* 1. TOP GREETING & OPERATIONAL HEADER */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-outline">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
              OTA Operations Center
            </span>
            <span className="text-outline-variant">•</span>
            <span className="text-xs text-outline">Trung Tâm Quản Trị Đặt Phòng Trực Tuyến</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface tracking-tight">
            Chào mừng trở lại, {userName}
          </h1>

          <p className="text-xs sm:text-base text-on-surface-variant max-w-2xl leading-relaxed">
            Hệ thống phân phối phòng OTA đang hoạt động bình thường. Theo dõi trạng thái đặt phòng, đối soát thanh toán chuyển khoản và phân phối tồn kho thời gian thực.
          </p>
        </div>

        {/* Quick Executive Actions */}
        <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto shrink-0">
          <button
            onClick={handleSyncOTA}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-2xl bg-surface-container-lowest text-on-surface border border-outline-variant/30 shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-primary ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ dữ liệu'}</span>
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

      {/* 2. 4 REAL OTA KPI CARDS (CALCULATED DIRECTLY FROM BOOKINGS) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Tổng doanh thu */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between relative overflow-hidden group hover:shadow-xs transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">Tổng Doanh Thu Đơn</span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-on-surface">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-primary font-semibold mt-1">
              <span>Giá trị trung bình đơn:</span>
              <span className="font-bold">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(avgBookingValue)}
              </span>
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-outline text-xs">
            <span>Dữ liệu thực tế từ hệ thống</span>
            <span className="text-emerald-700 font-bold">Thời gian thực</span>
          </div>
        </div>

        {/* Card 2: Tổng đơn đặt phòng */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between relative overflow-hidden group hover:shadow-xs transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">Tổng Đơn Đặt Phòng</span>
            <div className="w-9 h-9 rounded-xl bg-tertiary-container/30 flex items-center justify-center text-tertiary">
              <CalendarDays className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-on-surface">{bookings.length}</span>
              <span className="text-xs font-bold text-tertiary px-2 py-0.5 rounded-full bg-tertiary-container/30">Giao dịch</span>
            </div>
            <div className="text-xs text-on-surface-variant flex items-center justify-between mt-1">
              <span>Đã thanh toán: {paidCount} đơn</span>
              <span className="font-bold text-primary">{bookings.length - paidCount} chưa tất toán</span>
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-outline text-xs">
            <span>Tỷ lệ hoàn tất thanh toán</span>
            <span className="text-tertiary font-bold">
              {bookings.length > 0 ? Math.round((paidCount / bookings.length) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Card 3: Đơn đã xác nhận */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between relative overflow-hidden group hover:shadow-xs transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">Đơn Đã Xác Nhận</span>
            <div className="w-9 h-9 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-on-surface">{confirmedCount}</span>
              <span className="text-xs text-outline font-medium">đơn hợp lệ</span>
            </div>
            <div className="text-xs text-on-surface-variant mt-1">
              Giữ chỗ hợp lệ hoặc đã hoàn tất thanh toán
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-outline text-xs">
            <span>Trạng thái phòng</span>
            <span className="text-primary font-bold text-[11px]">Đã giữ chỗ</span>
          </div>
        </div>

        {/* Card 4: Đơn chờ xử lý */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between relative overflow-hidden group hover:shadow-xs transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">Đơn Chờ Đối Soát / TT</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-on-surface">{pendingCount}</span>
              <span className="text-xs text-amber-700 font-bold px-2 py-0.5 rounded-full bg-amber-100">Cần theo dõi</span>
            </div>
            <div className="text-xs text-on-surface-variant mt-1">
              Đơn chưa thanh toán hoặc đang chờ xác nhận
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-outline text-xs">
            <span>Yêu cầu đối soát</span>
            <span className="text-amber-700 font-bold">VietQR tự động</span>
          </div>
        </div>
      </section>

      {/* 3. OTA SUMMARY & SYSTEM SHORTCUTS */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Booking Conversion & Payment Health */}
        <div className="lg:col-span-7 bg-surface-container-lowest p-6 sm:p-7 rounded-3xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-primary font-extrabold block">
                Hiệu Suất Phân Phối OTA
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-on-surface mt-0.5">
                Cơ Cấu Trạng Thái Đơn Hàng
              </h2>
            </div>
            <span className="text-xs font-semibold text-outline">
              Tổng số {bookings.length} giao dịch
            </span>
          </div>

          {/* Dynamic Progress Bars */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-on-surface mb-1.5">
                <span className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đã thanh toán (PAID)</span>
                </span>
                <span className="text-emerald-700 font-black">
                  {paidCount} đơn ({bookings.length > 0 ? Math.round((paidCount / bookings.length) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${bookings.length > 0 ? (paidCount / bookings.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold text-on-surface mb-1.5">
                <span className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Chờ thanh toán (PENDING / UNPAID)</span>
                </span>
                <span className="text-amber-700 font-black">
                  {pendingCount} đơn ({bookings.length > 0 ? Math.round((pendingCount / bookings.length) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${bookings.length > 0 ? (pendingCount / bookings.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold text-on-surface mb-1.5">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  <span>Đã xác nhận giữ chỗ (CONFIRMED)</span>
                </span>
                <span className="text-primary font-black">
                  {confirmedCount} đơn ({bookings.length > 0 ? Math.round((confirmedCount / bookings.length) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${bookings.length > 0 ? (confirmedCount / bookings.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/30 text-xs text-outline leading-relaxed">
            <span className="font-bold text-on-surface">Quy chuẩn đối soát OTA:</span> Đơn đặt phòng có phương thức chuyển khoản ngân hàng sẽ được hệ thống giữ chỗ tạm thời và tự động cập nhật trạng thái thanh toán khi quản trị viên xác nhận hoặc nhận webhook thanh toán.
          </div>
        </div>

        {/* Right Column: Fast Navigation to OTA Portals */}
        <div className="lg:col-span-5 bg-surface-container-lowest p-6 sm:p-7 rounded-3xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between space-y-5">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-primary font-extrabold block">
              Điều Hành Trực Tiếp
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-on-surface mt-0.5">
              Lối Tắt Quản Trị
            </h2>
          </div>

          <div className="space-y-3">
            <Link
              href="/admin/allotments"
              className="p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all border border-outline-variant/30 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-base text-on-surface group-hover:text-primary transition-colors">
                    Lịch Giá &amp; Tồn Kho (Allotments)
                  </div>
                  <div className="text-xs text-outline mt-0.5">
                    Quản lý số lượng phòng khả dụng &amp; điều chỉnh giá bán
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-outline group-hover:text-primary transition-colors" />
            </Link>

            <Link
              href="/admin/properties"
              className="p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all border border-outline-variant/30 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-secondary-container/30 text-secondary flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-base text-on-surface group-hover:text-primary transition-colors">
                    Danh Sách Khách Sạn &amp; Resort
                  </div>
                  <div className="text-xs text-outline mt-0.5">
                    Xem cơ sở lưu trú, hạng phòng &amp; thông tin hiển thị OTA
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-outline group-hover:text-primary transition-colors" />
            </Link>
          </div>

          <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-outline">
            <span>Ranh giới hệ thống:</span>
            <span className="font-semibold text-on-surface">OTA Booking Platform</span>
          </div>
        </div>
      </section>

      {/* 4. LIVE BOOKINGS MANAGEMENT TABLE (WIRED WITH DATA & ACTIONS) */}
      <section id="bookings-management-table" className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xs overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold text-on-surface">Danh Sách Đơn Đặt Phòng OTA</h3>
            </div>
            <p className="text-xs text-outline mt-1 max-w-xl">
              Quản lý và cập nhật tiến trình của từng đơn đặt phòng. Thao tác xác nhận thanh toán chuyển khoản và cập nhật trạng thái đơn trực tiếp.
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
            <div className="text-base font-semibold text-rose-600 max-w-md mx-auto leading-relaxed">
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
            <table className="w-full text-left text-base">
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
                      <div className="font-medium text-xs sm:text-base">
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

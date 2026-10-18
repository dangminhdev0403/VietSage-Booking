'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  CalendarDays,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Building2,
  RefreshCw,
} from 'lucide-react';
import {
  useBookingsQuery,
  useBookingSummaryQuery,
} from '@/features/bookings/hooks/use-bookings';

export default function AdminDashboardPage() {
  const { data: session, status: authStatus } = useSession();

  const user = session?.user as
    | {
        name?: string | null;
        role?: string;
        managedPropertyId?: string | null;
        accessibleProperties?: Array<{ id: string; name: string }>;
      }
    | undefined;

  const userName = user?.name || 'Tổng Quản Lý';
  const managedPropertyId = user?.managedPropertyId ?? undefined;

  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useBookingSummaryQuery(
    { property_id: managedPropertyId },
    { enabled: authStatus === 'authenticated' },
  );

  const {
    data: recentBookingsData,
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useBookingsQuery(
    {
      property_id: managedPropertyId,
      page: 1,
      pageSize: 5,
    },
    { enabled: authStatus === 'authenticated' },
  );

  const handleRefresh = async () => {
    await Promise.all([refetchSummary(), refetchBookings()]);
  };

  const grossBookingValue = summary?.gross_booking_value ?? 0;
  const totalBookings = summary?.total_bookings ?? 0;
  const confirmedBookings = summary?.confirmed_bookings ?? 0;
  const pendingBookings = summary?.pending_bookings ?? 0;
  const upcomingCheckins = summary?.upcoming_checkins_7d ?? 0;

  const recentBookings = recentBookingsData?.items || [];

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-10">
      {/* 1. TOP GREETING & OPERATIONAL HEADER */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-outline">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              OTA Operations Center
            </span>
            <span className="text-outline-variant">•</span>
            <span className="text-xs text-outline">Bảng Điều Hành Trung Tâm</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface tracking-tight">
            Chào mừng trở lại, {userName}
          </h1>

          <p className="text-xs sm:text-base text-on-surface-variant max-w-2xl leading-relaxed">
            Hệ thống phân phối phòng OTA đang hoạt động bình thường. Theo dõi số liệu doanh số thời gian thực, tiến độ thanh toán và các đơn sắp đến ngày nhận phòng.
          </p>
        </div>

        {/* Quick Executive Actions */}
        <div className="flex items-center gap-3 self-start lg:self-auto shrink-0">
          <button
            onClick={handleRefresh}
            className="px-4 py-2.5 rounded-2xl bg-surface-container-lowest text-on-surface border border-outline-variant/30 shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 text-xs font-bold cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-primary" />
            <span>Làm mới số liệu</span>
          </button>

          <Link
            href="/admin/bookings"
            className="px-4 py-2.5 rounded-2xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Quản lý đơn đặt</span>
          </Link>
        </div>
      </section>

      {/* 2. SERVER-AGGREGATED KPI CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Giá trị đặt phòng OTA (Gross Booking Value) */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between group hover:shadow-xs transition-all sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-outline">
              Giá Trị Đặt Phòng OTA
            </span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-on-surface">
              {summaryLoading ? (
                <span className="text-outline text-lg">Đang tải...</span>
              ) : (
                new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(grossBookingValue)
              )}
            </div>
            <p className="text-xs text-primary font-semibold mt-1">
              Gross Booking Value (GBV)
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-outline text-xs">
            <span>Tổng giá trị đơn</span>
            <span className="text-emerald-700 font-bold">Thời gian thực</span>
          </div>
        </div>

        {/* Card 2: Tổng số đơn */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between group hover:shadow-xs transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-outline">
              Tổng Số Đơn
            </span>
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface">
              <Calendar className="w-4.5 h-4.5 text-primary" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-on-surface">
              {summaryLoading ? '...' : totalBookings}
            </div>
            <p className="text-xs text-outline font-medium mt-1">
              Toàn bộ giao dịch
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-outline text-xs">
            <span>Đơn lưu trữ</span>
            <span className="font-semibold text-on-surface">OTA Platform</span>
          </div>
        </div>

        {/* Card 3: Đơn đã xác nhận */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between group hover:shadow-xs transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-outline">
              Đơn Đã Xác Nhận
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700">
              {summaryLoading ? '...' : confirmedBookings}
            </div>
            <p className="text-xs text-outline font-medium mt-1">
              Đã giữ chỗ / thanh toán
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-outline text-xs">
            <span>Tỷ lệ xác nhận</span>
            <span className="text-emerald-700 font-bold">
              {totalBookings > 0
                ? `${Math.round((confirmedBookings / totalBookings) * 100)}%`
                : '0%'}
            </span>
          </div>
        </div>

        {/* Card 4: Đơn chờ thanh toán */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between group hover:shadow-xs transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-outline">
              Đơn Chờ Thanh Toán
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-700">
              {summaryLoading ? '...' : pendingBookings}
            </div>
            <p className="text-xs text-outline font-medium mt-1">
              Chờ đối soát chuyển khoản
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-outline text-xs">
            <span>Cần theo dõi</span>
            <span className="text-amber-700 font-bold">Pending / Unpaid</span>
          </div>
        </div>

        {/* Card 5: Đơn sắp check-in (7 ngày) */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between group hover:shadow-xs transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-outline">
              Sắp Check-in (7 Ngày)
            </span>
            <div className="w-9 h-9 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
              <CalendarDays className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-primary">
              {summaryLoading ? '...' : upcomingCheckins}
            </div>
            <p className="text-xs text-outline font-medium mt-1">
              Khách sắp đến nhận phòng
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-outline text-xs">
            <span>Khung vận hành</span>
            <span className="text-primary font-bold">7 ngày tới</span>
          </div>
        </div>
      </section>

      {/* 3. OPERATIONAL SHORTCUTS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          href="/admin/bookings"
          className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                Quản Trị Đơn Đặt Phòng
              </h3>
              <p className="text-xs text-outline mt-0.5">
                Tra cứu, tìm kiếm, lọc theo trạng thái và hủy giữ chỗ
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-outline group-hover:text-primary transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/admin/payments"
          className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface group-hover:text-emerald-700 transition-colors">
                Lịch Sử Thanh Toán
              </h3>
              <p className="text-xs text-outline mt-0.5">
                Theo dõi giao dịch, mã tham chiếu đối soát VietQR
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-outline group-hover:text-emerald-700 transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/admin/properties"
          className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-container/30 flex items-center justify-center text-primary">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                Cơ Sở Lưu Trú &amp; Hạng Phòng
              </h3>
              <p className="text-xs text-outline mt-0.5">
                Xem danh mục khách sạn, sức chứa và chính sách giá
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-outline group-hover:text-primary transition-transform group-hover:translate-x-1" />
        </Link>
      </section>

      {/* 4. QUICK OVERVIEW TABLE: 5 MOST RECENT BOOKINGS */}
      <section className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xs overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-on-surface">
                Đơn Đặt Phòng Gần Đây
              </h2>
            </div>
            <p className="text-xs text-outline mt-1">
              Top 5 giao dịch đặt phòng mới nhất được ghi nhận trên hệ thống OTA
            </p>
          </div>

          <Link
            href="/admin/bookings"
            className="px-4 py-2 rounded-2xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <span>Xem toàn bộ danh sách đơn</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {bookingsLoading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-outline font-medium">
              Đang tải danh sách đơn gần đây...
            </p>
          </div>
        ) : recentBookings.length === 0 ? (
          <div className="py-20 text-center text-outline text-xs">
            Chưa có đơn đặt phòng nào được ghi nhận.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low text-outline uppercase tracking-wider text-xs font-bold border-b border-outline-variant/20">
                <tr>
                  <th className="py-4 px-6">Mã Đặt</th>
                  <th className="py-4 px-6">Khách Sạn</th>
                  <th className="py-4 px-6">Khách Hàng</th>
                  <th className="py-4 px-6">Thời Gian Lưu Trú</th>
                  <th className="py-4 px-6">Tổng Tiền</th>
                  <th className="py-4 px-6">Thanh Toán</th>
                  <th className="py-4 px-6 text-right">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-on-surface">
                {recentBookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-surface-container/50 transition-colors"
                  >
                    <td className="py-4 px-6 font-mono font-extrabold text-primary">
                      {b.booking_code}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-on-surface">
                        {b.property_name || 'Khách sạn liên kết'}
                      </div>
                      <div className="text-xs text-outline">
                        {b.room_type_name || 'Tiêu chuẩn'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-on-surface">
                        {b.guest_name}
                      </div>
                      <div className="text-xs text-outline">{b.guest_phone}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-xs">
                        {b.check_in} → {b.check_out}
                      </div>
                      <div className="text-xs text-outline">
                        ({b.nights} đêm)
                      </div>
                    </td>
                    <td className="py-4 px-6 font-black text-on-surface">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(b.total_price)}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
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
                    </td>
                    <td className="py-4 px-6 text-right">
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

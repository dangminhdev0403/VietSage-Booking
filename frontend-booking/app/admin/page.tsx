'use client';

import React, { useState } from 'react';
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
  Eye,
} from 'lucide-react';
import {
  useBookingsQuery,
  useBookingSummaryQuery,
} from '@/features/bookings/hooks/use-bookings';
import { usePropertiesQuery } from '@/features/catalog/hooks/use-catalog';
import {
  AdminBookingDetailDrawer,
  BookingDetailItem,
} from '@/features/bookings/components/admin-booking-detail-drawer';

function formatStayDates(checkIn: string, checkOut: string): string {
  try {
    const ci = checkIn.split('-');
    const co = checkOut.split('-');
    if (ci.length === 3 && co.length === 3) {
      return `${ci[2]}/${ci[1]} → ${co[2]}/${co[1]}/${co[0]}`;
    }
  } catch {
    // fallback
  }
  return `${checkIn} → ${checkOut}`;
}

function getBookingStatusBadge(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return {
        label: 'Đã xác nhận',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500',
      };
    case 'CONFIRMING':
      return {
        label: 'Đang xác nhận',
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
        dotClass: 'bg-sky-500',
      };
    case 'PENDING':
      return {
        label: 'Chờ thanh toán',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500',
      };
    case 'CHECKED_IN':
      return {
        label: 'Đang lưu trú',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dotClass: 'bg-indigo-500',
      };
    case 'CANCELLED':
      return {
        label: 'Đã hủy',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        dotClass: 'bg-rose-500',
      };
    case 'COMPLETED':
      return {
        label: 'Hoàn thành',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500',
      };
    default:
      return {
        label: status,
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        dotClass: 'bg-slate-400',
      };
  }
}

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

  const isPartner = Boolean(user?.managedPropertyId || user?.role === 'HOTEL_PARTNER');
  const managedPropertyId = user?.managedPropertyId ?? undefined;
  const userName = user?.name || (isPartner ? 'Quản Lý Đối Tác' : 'Tổng Quản Lý Sàn');
  const [adminSelectedPropertyId, setAdminSelectedPropertyId] = useState<string>('ALL');

  const { data: propertiesData } = usePropertiesQuery(
    {},
    { enabled: !managedPropertyId && authStatus === 'authenticated' },
  );
  const properties = propertiesData?.items || [];

  const effectivePropertyId = managedPropertyId
    ? managedPropertyId
    : adminSelectedPropertyId === 'ALL'
    ? undefined
    : adminSelectedPropertyId;

  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useBookingSummaryQuery(
    { property_id: effectivePropertyId },
    { enabled: authStatus === 'authenticated' },
  );

  const {
    data: recentBookingsData,
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useBookingsQuery(
    {
      property_id: effectivePropertyId,
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
  const [selectedBooking, setSelectedBooking] = useState<BookingDetailItem | null>(null);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-10">
      {/* 1. TOP GREETING & OPERATIONAL HEADER */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-stone-600">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-primary whitespace-nowrap">
              Trung Tâm Điều Hành
            </span>
            <span className="text-stone-300">•</span>
            <span className="text-xs sm:text-sm text-stone-600 font-medium whitespace-nowrap">
              Điều Hành Sàn OTA
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface tracking-tight text-balance">
            Chào mừng trở lại, {userName}
          </h1>
        </div>

        {/* Quick Executive Actions */}
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto shrink-0">
          {!managedPropertyId && properties.length > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-2xs">
              <Building2 className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-bold text-outline whitespace-nowrap">Lọc cơ sở:</span>
              <select
                value={adminSelectedPropertyId}
                onChange={(e) => setAdminSelectedPropertyId(e.target.value)}
                className="bg-transparent text-xs font-bold text-on-surface focus:outline-none cursor-pointer max-w-[200px] truncate"
              >
                <option value="ALL">Toàn sàn (Tất cả đối tác)</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleRefresh}
            className="px-4 py-2.5 rounded-2xl bg-surface-container-lowest text-on-surface border border-outline-variant/30 shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 text-sm font-bold cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4 text-primary" />
            <span>Làm mới số liệu</span>
          </button>

          <Link
            href="/admin/bookings"
            className="px-4 py-2.5 rounded-2xl font-bold text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer bg-primary hover:bg-[#684f2c] text-on-primary whitespace-nowrap"
          >
            <Calendar className="w-4 h-4" />
            <span>Quản lý đơn toàn sàn</span>
          </Link>
        </div>
      </section>

      {/* 2. SERVER-AGGREGATED KPI CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Giá trị đặt phòng OTA (Gross Booking Value) */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between group hover:shadow-xs transition-all sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-stone-500">
              Giá Trị Đặt Phòng OTA
            </span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              {summaryLoading ? (
                <span className="text-outline text-lg">Đang tải...</span>
              ) : (
                new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(grossBookingValue)
              )}
            </div>
            <p className="text-xs sm:text-sm text-primary font-bold mt-1">
              Gross Booking Value (GBV)
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs sm:text-sm text-stone-600">
            <span>Tổng giá trị đơn</span>
            <span className="text-emerald-700 font-extrabold">Thời gian thực</span>
          </div>
        </div>

        {/* Card 2: Tổng số đơn */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between group hover:shadow-xs transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-stone-500">
              Tổng Số Đơn
            </span>
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface">
              <Calendar className="w-4.5 h-4.5 text-primary" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              {summaryLoading ? '...' : totalBookings}
            </div>
            <p className="text-xs sm:text-sm text-stone-500 font-semibold mt-1">
              Toàn bộ giao dịch
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs sm:text-sm text-stone-600">
            <span>Đơn lưu trữ</span>
            <span className="font-bold text-on-surface">OTA Platform</span>
          </div>
        </div>

        {/* Card 3: Đơn đã xác nhận */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between group hover:shadow-xs transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-stone-500">
              Đơn Đã Xác Nhận
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
              {summaryLoading ? '...' : confirmedBookings}
            </div>
            <p className="text-xs sm:text-sm text-stone-500 font-semibold mt-1">
              Đã giữ chỗ / thanh toán
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs sm:text-sm text-stone-600">
            <span>Tỷ lệ xác nhận</span>
            <span className="text-emerald-700 font-extrabold">
              {totalBookings > 0
                ? `${Math.round((confirmedBookings / totalBookings) * 100)}%`
                : '0%'}
            </span>
          </div>
        </div>

        {/* Card 4: Đơn chờ thanh toán */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between group hover:shadow-xs transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-stone-500">
              Đơn Chờ Thanh Toán
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight">
              {summaryLoading ? '...' : pendingBookings}
            </div>
            <p className="text-xs sm:text-sm text-stone-500 font-semibold mt-1">
              Chờ đối soát chuyển khoản
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs sm:text-sm text-stone-600">
            <span>Cần theo dõi</span>
            <span className="text-amber-700 font-extrabold">Pending / Unpaid</span>
          </div>
        </div>

        {/* Card 5: Đơn sắp check-in (7 ngày) */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between group hover:shadow-xs transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-stone-500">
              Sắp Check-in (7 Ngày)
            </span>
            <div className="w-9 h-9 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
              <CalendarDays className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
              {summaryLoading ? '...' : upcomingCheckins}
            </div>
            <p className="text-xs sm:text-sm text-stone-500 font-semibold mt-1">
              Khách sắp đến nhận phòng
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs sm:text-sm text-stone-600">
            <span>Khung vận hành</span>
            <span className="text-primary font-extrabold">7 ngày tới</span>
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
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                Quản Trị Đơn Đặt Phòng
              </h3>
              <p className="text-sm text-stone-500 mt-1 leading-normal">
                Tra cứu, tìm kiếm, lọc theo trạng thái và hủy giữ chỗ
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-primary transition-transform group-hover:translate-x-1 shrink-0 ml-2" />
        </Link>

        <Link
          href="/admin/payments"
          className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-on-surface group-hover:text-emerald-700 transition-colors">
                Lịch Sử Thanh Toán
              </h3>
              <p className="text-sm text-stone-500 mt-1 leading-normal">
                Theo dõi giao dịch, mã tham chiếu đối soát thanh toán
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-emerald-700 transition-transform group-hover:translate-x-1 shrink-0 ml-2" />
        </Link>

        <Link
          href="/admin/properties"
          className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-container/30 flex items-center justify-center text-primary shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                Cơ Sở Lưu Trú &amp; Hạng Phòng
              </h3>
              <p className="text-sm text-stone-500 mt-1 leading-normal">
                Xem danh mục khách sạn, sức chứa và chính sách giá
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-primary transition-transform group-hover:translate-x-1 shrink-0 ml-2" />
        </Link>
      </section>

      {/* 4. QUICK OVERVIEW TABLE: 5 MOST RECENT BOOKINGS */}
      <section className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xs overflow-hidden">
        <div className="p-6 sm:p-7 border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-bold text-on-surface text-balance">
                  Đơn Đặt Phòng Gần Đây
                </h2>
                <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200 whitespace-nowrap">
                  5 đơn mới nhất
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/admin/bookings"
            className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 text-sm font-bold transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer border border-stone-200/80 whitespace-nowrap"
          >
            <span>Xem toàn bộ danh sách</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {bookingsLoading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-stone-500 font-medium">
              Đang tải danh sách đơn gần đây...
            </p>
          </div>
        ) : recentBookings.length === 0 ? (
          <div className="py-20 text-center text-stone-500 text-sm font-medium">
            Chưa có đơn đặt phòng nào được ghi nhận.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/90 text-slate-600 uppercase tracking-wider text-xs font-extrabold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4 w-[130px] whitespace-nowrap">Mã Đặt</th>
                  <th className="py-3 px-4 min-w-[200px]">Cơ Sở &amp; Hạng Phòng</th>
                  <th className="py-3 px-4 w-[150px] whitespace-nowrap">Khách Hàng</th>
                  <th className="py-3 px-4 w-[140px] whitespace-nowrap">Lưu Trú</th>
                  <th className="py-3 px-4 w-[120px] text-right whitespace-nowrap">Tổng Tiền</th>
                  <th className="py-3 px-4 w-[150px] text-center whitespace-nowrap">Trạng Thái</th>
                  <th className="py-3 px-4 w-[110px] text-right whitespace-nowrap">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-900">
                {recentBookings.map((b) => {
                  const statusInfo = getBookingStatusBadge(b.status);

                  return (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                      title="Nhấn để xem chi tiết toàn bộ đơn đặt phòng"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 group-hover:bg-slate-200/80 px-2.5 py-1 rounded-lg border border-slate-200/90 whitespace-nowrap transition-colors">
                          {b.booking_code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div
                          className="font-bold text-slate-900 text-sm truncate max-w-[240px]"
                          title={`${b.property_name || 'Khách sạn liên kết'}${b.room_type_name ? ` · ${b.room_type_name}` : ''}`}
                        >
                          <span>{b.property_name || 'Khách sạn liên kết'}</span>
                          {b.room_type_name && (
                            <span className="text-xs text-slate-500 font-normal ml-1.5 truncate">
                              · {b.room_type_name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div
                          className="font-bold text-slate-900 text-sm truncate max-w-[140px]"
                          title={`Khách hàng: ${b.guest_name}${b.guest_phone ? ` • SĐT: ${b.guest_phone}` : ''}`}
                        >
                          {b.guest_name}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className="font-bold text-xs text-slate-900"
                          title={`${formatStayDates(b.check_in, b.check_out)} • ${b.nights} đêm nghỉ`}
                        >
                          {formatStayDates(b.check_in, b.check_out)}
                          <span className="text-slate-500 font-normal ml-1">({b.nights}đ)</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-mono text-sm font-black text-slate-900">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(b.total_price)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border whitespace-nowrap ${statusInfo.badgeClass}`}
                          title={`Trạng thái: ${statusInfo.label} • Thanh toán: ${
                            b.payment_status === 'PAID'
                              ? 'Đã thanh toán'
                              : b.payment_status === 'REFUNDED'
                              ? 'Đã hoàn tiền'
                              : 'Chưa thanh toán'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusInfo.dotClass}`} />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBooking(b);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-primary hover:text-white text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs whitespace-nowrap"
                          title="Xem chi tiết đơn đặt phòng"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* DETAIL DRAWER (SLIDE-OVER) */}
      <AdminBookingDetailDrawer
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />
    </div>
  );
}

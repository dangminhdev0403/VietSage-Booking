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
  CreditCard,
  Building2,
  RefreshCw,
  Eye,
  Phone,
  Hotel,
  BedDouble,
} from 'lucide-react';
import {
  useBookingsQuery,
  useBookingSummaryQuery,
} from '@/features/bookings/hooks/use-bookings';
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

export default function PartnerDashboardPage() {
  const { data: session, status: authStatus } = useSession();

  const user = session?.user as
    | {
        name?: string | null;
        role?: string;
        managedPropertyId?: string | null;
        accessibleProperties?: Array<{ id: string; name: string }>;
      }
    | undefined;

  const managedPropertyId = user?.managedPropertyId ?? undefined;
  const userName = user?.name || 'Đối Tác Khách Sạn';
  const managedPropertyName = managedPropertyId
    ? user?.accessibleProperties?.find((p) => p.id === managedPropertyId)?.name || 'Cơ sở lưu trú liên kết'
    : 'Cơ sở lưu trú liên kết';

  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useBookingSummaryQuery(
    { property_id: managedPropertyId },
    { enabled: authStatus === 'authenticated' && Boolean(managedPropertyId) },
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
    { enabled: authStatus === 'authenticated' && Boolean(managedPropertyId) },
  );

  const handleRefresh = async () => {
    await Promise.all([refetchSummary(), refetchBookings()]);
  };

  const grossBookingValue = summary?.gross_booking_value ?? 0;
  const totalBookings = summary?.total_bookings ?? 0;
  const confirmedBookings = summary?.confirmed_bookings ?? 0;
  const pendingBookings = summary?.pending_bookings ?? 0;

  // Selected Booking for Drawer
  const [selectedBooking, setSelectedBooking] = useState<BookingDetailItem | null>(null);

  const formatVND = (val: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
      {/* 1. HEADER HERO */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-800 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
            <Hotel className="w-4 h-4 text-emerald-700" />
            <span>Hotelier Extranet</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-950 font-bold">{managedPropertyName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-balance">
            Tổng Quan Vận Hành Cơ Sở
          </h1>
          <p className="text-sm sm:text-base text-slate-600 text-pretty">
            Theo dõi dòng khách đặt phòng, đối soát tiền cọc 30% trực tuyến và quản lý hạn mức phòng thuộc {managedPropertyName}.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={summaryLoading || bookingsLoading}
          className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:bg-slate-50 transition-all flex items-center gap-2 text-sm font-bold cursor-pointer disabled:opacity-50 self-start md:self-auto"
        >
          <RefreshCw
            className={`w-4 h-4 text-slate-700 ${
              summaryLoading || bookingsLoading ? 'animate-spin text-emerald-700' : ''
            }`}
          />
          <span>Cập nhật số liệu</span>
        </button>
      </div>

      {/* 2. OPERATIONAL KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Metric 1: Gross Booking Revenue */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-500">
              Tổng Doanh Thu Phòng
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {summaryLoading ? (
                <div className="h-8 w-32 bg-slate-100 rounded-lg animate-pulse" />
              ) : (
                formatVND(grossBookingValue)
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>Gồm cọc 30% và thanh toán quầy</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Total Bookings */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-500">
              Tổng Lượt Đặt Phòng
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {summaryLoading ? (
                <div className="h-8 w-20 bg-slate-100 rounded-lg animate-pulse" />
              ) : (
                `${totalBookings} đơn`
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{confirmedBookings} đơn đã xác nhận</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Pending Confirmation */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-500">
              Đang Chờ Xác Nhận
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {summaryLoading ? (
                <div className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse" />
              ) : (
                `${pendingBookings} đơn`
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>Khách giữ chỗ tạm thời</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Allotment Sync Link */}
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-emerald-200/80">
                Lịch Giá &amp; Tồn Kho
              </span>
              <CalendarDays className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="mt-3 text-lg font-bold leading-snug">
              Kiểm soát giá bán &amp; Chặn bán (Stop-Sell)
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/partner/allotments"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-bold text-white transition-all backdrop-blur-xs whitespace-nowrap"
            >
              <span>Mở Lịch Quỹ Phòng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. OPERATIONAL QUICK LINKS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Link
          href="/partner/bookings"
          className="group p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-emerald-500/40 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                Khách Đặt Phòng
              </div>
              <div className="text-xs text-slate-500">Tra cứu thông tin lưu trú</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href="/partner/payments"
          className="group p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-emerald-500/40 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                Doanh Thu Tiền Phòng
              </div>
              <div className="text-xs text-slate-500">Đối chiếu tiền cọc &amp; quầy</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href="/partner/rooms"
          className="group p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-emerald-500/40 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                Quản Lý Phòng &amp; Giá
              </div>
              <div className="text-xs text-slate-500">Thông số phòng &amp; tiện ích</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href="/partner/allotments"
          className="group p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-emerald-500/40 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                Lịch Giá &amp; Tồn Kho
              </div>
              <div className="text-xs text-slate-500">Điều chỉnh hạn mức bán</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href="/partner/properties"
          className="group p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-emerald-500/40 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                Cài Đặt Khách Sạn
              </div>
              <div className="text-xs text-slate-500">Cấu hình thông tin cơ sở</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>

      {/* 4. RECENT BOOKINGS QUEUE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight text-balance">
              Đơn Đặt Phòng Mới Nhận
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 text-pretty">
              Danh sách 5 đơn khách hàng đặt phòng gần nhất của {managedPropertyName}.
            </p>
          </div>
          <Link
            href="/partner/bookings"
            className="text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <span>Xem toàn bộ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {bookingsLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Đang tải dữ liệu đơn đặt phòng...
          </div>
        ) : recentBookingsData?.items && recentBookingsData.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Mã Đơn</th>
                  <th className="py-3 px-4">Khách Hàng</th>
                  <th className="py-3 px-4">Hạng Phòng</th>
                  <th className="py-3 px-4">Lịch Trình</th>
                  <th className="py-3 px-4 text-right">Tổng Tiền / Cọc 30%</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentBookingsData.items.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-900">
                      {b.booking_code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{b.guest_name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{b.guest_phone || 'Chưa cập nhật'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {b.room_type_name || 'Hạng phòng nghỉ dưỡng'}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                      {formatStayDates(b.check_in, b.check_out)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold text-slate-900">{formatVND(b.total_price)}</div>
                      <div className="text-xs text-emerald-800 font-semibold">
                        Cọc: {formatVND(b.deposit_amount || Math.round(b.total_price * 0.3))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                          b.status === 'CONFIRMED'
                            ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                            : b.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-950 border border-amber-200'
                            : 'bg-rose-50 text-rose-950 border border-rose-200'
                        }`}
                      >
                        {b.status === 'CONFIRMED'
                          ? 'Đã xác nhận'
                          : b.status === 'PENDING'
                          ? 'Chờ cọc'
                          : 'Đã hủy'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedBooking(b as unknown as BookingDetailItem)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>Chi tiết</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-sm">
            Chưa có đơn đặt phòng nào gần đây cho cơ sở lưu trú này.
          </div>
        )}
      </div>

      {/* DETAIL DRAWER */}
      {selectedBooking && (
        <AdminBookingDetailDrawer
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
}

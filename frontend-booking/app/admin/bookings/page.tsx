'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Calendar,
  Search,
  Filter,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Building2,
  Phone,
  Mail,
  User,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  useBookingsQuery,
  useUpdateBookingStatusMutation,
} from '@/features/bookings/hooks/use-bookings';
import { usePropertiesQuery } from '@/features/catalog/hooks/use-catalog';
import {
  AdminBookingDetailDrawer,
  BookingDetailItem,
} from '@/features/bookings/components/admin-booking-detail-drawer';
import { luxuryAlert } from '@/lib/alert/luxury-alert';

type BookingItem = NonNullable<ReturnType<typeof useBookingsQuery>['data']>['items'][number];

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

export default function AdminBookingsPage() {
  const { data: session, status: authStatus } = useSession();

  const user = session?.user as
    | {
        role?: string;
        managedPropertyId?: string | null;
        accessibleProperties?: Array<{ id: string; name: string }>;
      }
    | undefined;

  const isPartner = Boolean(user?.managedPropertyId || user?.role === 'HOTEL_PARTNER');
  const managedPropertyId = user?.managedPropertyId ?? undefined;
  const managedPropertyName = managedPropertyId
    ? user?.accessibleProperties?.find((p) => p.id === managedPropertyId)?.name || 'Cơ sở lưu trú liên kết'
    : null;

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

  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected Booking for Detail Drawer
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);

  // Cancel Modal State
  const [cancelingBooking, setCancelingBooking] = useState<BookingItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  const {
    data: bookingsData,
    isLoading,
    error,
    refetch,
  } = useBookingsQuery(
    {
      search: activeSearch || undefined,
      status: statusTab === 'ALL' ? undefined : statusTab,
      property_id: effectivePropertyId,
      page: currentPage,
      pageSize,
    },
    { enabled: authStatus === 'authenticated' },
  );

  const updateStatusMutation = useUpdateBookingStatusMutation();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput.trim());
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setActiveSearch('');
    setCurrentPage(1);
  };

  const handleTabChange = (tab: 'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED') => {
    setStatusTab(tab);
    setCurrentPage(1);
  };

  const openCancelModal = (booking: BookingItem) => {
    setCancelingBooking(booking);
    setCancelReason('');
    setCancelError(null);
  };

  const closeCancelModal = () => {
    setCancelingBooking(null);
    setCancelReason('');
    setCancelError(null);
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelingBooking) return;

    const trimmedReason = cancelReason.trim();
    if (!trimmedReason || trimmedReason.length < 5) {
      setCancelError('Vui lòng nhập lý do hủy chi tiết (tối thiểu 5 ký tự)');
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        id: cancelingBooking.id,
        status: 'CANCELLED',
        reason: trimmedReason,
      });

      await luxuryAlert.success({
        title: 'Hủy Đơn Đặt Phòng Thành Công',
        message: `Đơn đặt phòng ${cancelingBooking.booking_code} đã được hủy thành công.`,
        confirmText: 'Đã Hiểu',
      });
      closeCancelModal();
      refetch();
    } catch (err: unknown) {
      const formatted = luxuryAlert.formatApiError(err);
      setCancelError(formatted.message || 'Không thể hủy đơn đặt phòng, vui lòng thử lại');
    }
  };

  const bookings = bookingsData?.items || [];
  const totalItems = bookingsData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
            <Calendar className={`w-4 h-4 ${isPartner ? 'text-emerald-600' : 'text-primary'}`} />
            <span className={isPartner ? 'text-emerald-700' : 'text-primary'}>
              {isPartner ? 'Kênh Đối Tác' : 'Kênh Quản Trị OTA'}
            </span>
            {isPartner && managedPropertyName && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-950 font-bold">{managedPropertyName}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 text-balance">
            Quản Lý Đơn Đặt Phòng
          </h1>
        </div>

        <button
          onClick={() => refetch()}
          className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:bg-slate-50 transition-all flex items-center gap-2 text-sm font-bold cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-slate-700" />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {/* 2. SEARCH & FILTER CONTROLS */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 bg-slate-50 rounded-2xl px-4 py-2.5 border border-slate-200 focus-within:border-primary transition-colors flex items-center">
            <Search className="w-4.5 h-4.5 text-slate-400 mr-2.5 shrink-0" />
            <input
              type="text"
              placeholder={isPartner ? 'Tìm theo mã đơn, họ tên khách, số điện thoại...' : 'Tìm mã đơn, tên khách, số điện thoại toàn sàn...'}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden w-full font-medium"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {!managedPropertyId && properties.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 shrink-0">
              <Building2 className="w-4 h-4 text-primary shrink-0" />
              <select
                value={adminSelectedPropertyId}
                onChange={(e) => {
                  setAdminSelectedPropertyId(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer max-w-[220px] truncate"
              >
                <option value="ALL">Tất cả khách sạn đối tác</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className={`px-6 py-2.5 font-bold text-sm rounded-2xl transition-all shadow-xs shrink-0 cursor-pointer ${
              isPartner
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                : 'bg-primary hover:bg-[#684f2c] text-on-primary'
            }`}
          >
            Tìm kiếm
          </button>
        </form>

        {/* Status Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs sm:text-sm font-bold text-slate-500 mr-1 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>Trạng thái:</span>
            </span>

            {(['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  statusTab === tab
                    ? isPartner
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-primary text-on-primary shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/60'
                }`}
              >
                {tab === 'ALL'
                  ? 'Tất cả'
                  : tab === 'PENDING'
                  ? 'Chờ thanh toán'
                  : tab === 'CONFIRMED'
                  ? 'Đã xác nhận'
                  : 'Đã hủy'}
              </button>
            ))}
          </div>

          <span className="text-xs sm:text-sm text-slate-500 font-medium">
            Tìm thấy <strong className="text-slate-900 font-bold">{totalItems}</strong> đơn đặt phòng
          </span>
        </div>
      </div>

      {/* 3. BOOKINGS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">Đang tải danh sách đặt phòng...</p>
          </div>
        ) : error ? (
          <div className="p-16 text-center space-y-4">
            <div className="text-sm font-semibold text-rose-600 max-w-md mx-auto">
              Không thể tải danh sách đơn đặt phòng. Vui lòng kiểm tra lại kết nối.
            </div>
            <button
              onClick={() => refetch()}
              className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-900 cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-24 text-center text-slate-500 text-sm font-medium">
            Không tìm thấy đơn đặt phòng nào phù hợp với điều kiện tìm kiếm.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/90 text-slate-600 uppercase tracking-wider text-xs font-extrabold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4 w-[130px] whitespace-nowrap">Mã Đơn</th>
                  <th className="py-3 px-4 min-w-[180px]">{isPartner ? 'Hạng Phòng' : 'Cơ Sở & Phòng'}</th>
                  <th className="py-3 px-4 w-[150px] whitespace-nowrap">Khách Hàng</th>
                  <th className="py-3 px-4 w-[150px] whitespace-nowrap">Lưu Trú</th>
                  <th className="py-3 px-4 w-[130px] text-right whitespace-nowrap">Tổng Tiền</th>
                  <th className="py-3 px-4 w-[150px] text-center whitespace-nowrap">Trạng Thái</th>
                  <th className="py-3 px-4 w-[110px] text-right whitespace-nowrap">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-900">
                {bookings.map((b) => {
                  const statusInfo = getBookingStatusBadge(b.status);
                  const canCancel =
                    b.status === 'PENDING' &&
                    (b.payment_status === 'UNPAID' || !b.payment_status);

                  return (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                      title="Nhấn để xem chi tiết đơn đặt phòng"
                    >
                      {/* Booking Code */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 group-hover:bg-slate-200/80 px-2.5 py-1 rounded-lg border border-slate-200/90 whitespace-nowrap transition-colors">
                          {b.booking_code}
                        </span>
                      </td>

                      {/* Property & Room Type (Clean summary) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div
                          className="font-bold text-slate-900 text-sm truncate max-w-[220px]"
                          title={b.room_type_name || b.property_name || 'Cơ sở lưu trú'}
                        >
                          {isPartner
                            ? (b.room_type_name || 'Hạng phòng tiêu chuẩn')
                            : (b.property_name || 'Cơ sở lưu trú')}
                        </div>
                      </td>

                      {/* Guest Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-sm truncate max-w-[140px]" title={b.guest_name}>
                          {b.guest_name}
                        </div>
                      </td>

                      {/* Stay Dates */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-xs text-slate-900">
                          {formatStayDates(b.check_in, b.check_out)}
                        </span>
                      </td>

                      {/* Total Price */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-mono text-sm font-black text-slate-900">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(b.total_price)}
                        </span>
                      </td>

                      {/* Single Status Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border whitespace-nowrap ${statusInfo.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusInfo.dotClass}`} />
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedBooking(b)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-primary hover:text-white text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs whitespace-nowrap"
                            title="Xem chi tiết đơn đặt phòng"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Chi tiết</span>
                          </button>

                          {canCancel && (
                            <button
                              type="button"
                              onClick={() => openCancelModal(b)}
                              className="px-2 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                              title="Hủy đơn giữ chỗ"
                            >
                              Hủy
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
            <span className="text-xs sm:text-sm text-slate-500">
              Trang <strong className="text-slate-900">{currentPage}</strong> trên{' '}
              <strong className="text-slate-900">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Trước</span>
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <span>Sau</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. DETAIL DRAWER (SLIDE-OVER) */}
      <AdminBookingDetailDrawer
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onCancelRequest={(b) => {
          setSelectedBooking(null);
          openCancelModal(b);
        }}
      />

      {/* 5. CANCEL BOOKING MODAL */}
      {cancelingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl max-w-3xl lg:max-w-4xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-lg">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Xác Nhận Hủy Đơn Đặt Phòng</span>
              </div>
              <button
                onClick={closeCancelModal}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
              <div className="space-y-3 text-sm text-slate-600">
                <p className="text-pretty">
                  Quý đối tác đang thực hiện hủy đơn giữ chỗ{' '}
                  <strong className="text-slate-900 font-mono">
                    {cancelingBooking.booking_code}
                  </strong>{' '}
                  của khách hàng{' '}
                  <strong className="text-slate-900">{cancelingBooking.guest_name}</strong>.
                </p>
                <div className="p-4 bg-slate-50 rounded-2xl space-y-2 text-xs border border-slate-200/80">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cơ sở: </span>
                    <span className="font-bold text-slate-900 text-right">
                      {cancelingBooking.property_name || 'Khách sạn liên kết'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Thời gian: </span>
                    <span className="font-bold text-slate-900 font-mono">
                      {cancelingBooking.check_in} → {cancelingBooking.check_out}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-slate-200/60">
                    <span className="text-slate-500">Tổng giá trị đơn: </span>
                    <span className="font-black text-slate-900 font-mono">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(cancelingBooking.total_price)}
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleConfirmCancel} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Lý do hủy đơn <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Nhập lý do hủy (ví dụ: Khách hàng yêu cầu hủy phòng, Quá hạn thanh toán giữ chỗ...)"
                    value={cancelReason}
                    onChange={(e) => {
                      setCancelReason(e.target.value);
                      if (cancelError) setCancelError(null);
                    }}
                    className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden resize-none font-medium"
                    required
                  />
                </div>

                {cancelError && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                    {cancelError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeCancelModal}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>

                  <button
                    type="submit"
                    disabled={updateStatusMutation.isPending}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    {updateStatusMutation.isPending ? 'Đang xử lý...' : 'Xác nhận hủy đơn'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

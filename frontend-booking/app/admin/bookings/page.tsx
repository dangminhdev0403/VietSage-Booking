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
} from 'lucide-react';
import {
  useBookingsQuery,
  useUpdateBookingStatusMutation,
} from '@/features/bookings/hooks/use-bookings';
import { luxuryAlert } from '@/lib/alert/luxury-alert';
type BookingItem = NonNullable<ReturnType<typeof useBookingsQuery>['data']>['items'][number];

export default function AdminBookingsPage() {
  const { data: session, status: authStatus } = useSession();

  const user = session?.user as
    | {
        managedPropertyId?: string | null;
      }
    | undefined;

  const managedPropertyId = user?.managedPropertyId ?? undefined;

  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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
      property_id: managedPropertyId,
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

      luxuryAlert.toast(`Đã hủy đơn ${cancelingBooking.booking_code} thành công`, 'success');
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
          <div className="flex items-center gap-2 text-outline text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-primary" />
            <span>Quản Trị Vận Hành OTA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight mt-1">
            Danh Sách Đơn Đặt Phòng
          </h1>
          <p className="text-xs sm:text-sm text-outline mt-1">
            Tra cứu, kiểm tra tình trạng thanh toán và xử lý đơn đặt chỗ trên toàn hệ thống
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="px-4 py-2.5 rounded-2xl bg-surface-container-lowest text-on-surface border border-outline-variant/30 shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 text-xs font-bold cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-primary" />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {/* 2. SEARCH & FILTER CONTROLS */}
      <div className="bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/30 shadow-2xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 bg-surface-container rounded-2xl px-4 py-2.5 border border-outline-variant/30 focus-within:border-primary/50 transition-colors flex items-center">
            <Search className="w-4 h-4 text-outline mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã đơn, họ tên khách, email, số điện thoại..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-transparent text-xs sm:text-sm text-on-surface placeholder:text-outline focus:outline-hidden w-full font-medium"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="text-outline hover:text-on-surface p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-2xl hover:bg-primary/90 transition-all shadow-xs shrink-0 cursor-pointer"
          >
            Tìm kiếm
          </button>
        </form>

        {/* Status Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-outline-variant/10">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-outline mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Trạng thái:</span>
            </span>

            {(['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  statusTab === tab
                    ? 'bg-primary text-on-primary shadow-2xs'
                    : 'bg-surface-container text-outline hover:text-on-surface'
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

          <span className="text-xs text-outline font-medium">
            Tìm thấy <strong className="text-on-surface">{totalItems}</strong> đơn đặt phòng
          </span>
        </div>
      </div>

      {/* 3. BOOKINGS TABLE */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-outline font-medium">Đang tải danh sách đặt phòng...</p>
          </div>
        ) : error ? (
          <div className="p-16 text-center space-y-4">
            <div className="text-sm font-semibold text-rose-600 max-w-md mx-auto">
              Không thể tải danh sách đơn đặt phòng. Vui lòng kiểm tra lại kết nối.
            </div>
            <button
              onClick={() => refetch()}
              className="px-5 py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface"
            >
              Thử lại
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-24 text-center text-outline text-xs">
            Không tìm thấy đơn đặt phòng nào phù hợp với điều kiện tìm kiếm.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low text-outline uppercase tracking-wider text-xs font-bold border-b border-outline-variant/20">
                <tr>
                  <th className="py-4 px-6">Mã Đơn</th>
                  <th className="py-4 px-6">Khách Sạn &amp; Phòng</th>
                  <th className="py-4 px-6">Thông Tin Khách</th>
                  <th className="py-4 px-6">Lưu Trú</th>
                  <th className="py-4 px-6">Tổng Tiền &amp; Thanh Toán</th>
                  <th className="py-4 px-6">Trạng Thái Đơn</th>
                  <th className="py-4 px-6 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-on-surface">
                {bookings.map((b) => {
                  const canCancel =
                    b.status === 'PENDING' &&
                    (b.payment_status === 'UNPAID' || !b.payment_status);

                  return (
                    <tr key={b.id} className="hover:bg-surface-container/50 transition-colors">
                      {/* Booking Code */}
                      <td className="py-4 px-6">
                        <span className="font-mono font-extrabold text-primary text-sm">
                          {b.booking_code}
                        </span>
                        <div className="text-xs text-outline mt-0.5">
                          {new Date(b.created_at).toLocaleDateString('vi-VN')}
                        </div>
                      </td>

                      {/* Property & Room Type */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-on-surface flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{b.property_name || 'Cơ sở lưu trú'}</span>
                        </div>
                        <div className="text-xs text-outline mt-0.5">
                          {b.room_type_name || 'Hạng phòng tiêu chuẩn'}
                        </div>
                      </td>

                      {/* Guest Details */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-on-surface flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-outline shrink-0" />
                          <span>{b.guest_name}</span>
                        </div>
                        <div className="text-xs text-outline mt-0.5 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 shrink-0" />
                          <span>{b.guest_phone}</span>
                        </div>
                        {b.guest_email && (
                          <div className="text-xs text-outline mt-0.5 flex items-center gap-1.5">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[140px]">{b.guest_email}</span>
                          </div>
                        )}
                      </td>

                      {/* Stay Dates */}
                      <td className="py-4 px-6">
                        <div className="font-medium text-xs">
                          {b.check_in} → {b.check_out}
                        </div>
                        <div className="text-xs text-outline font-medium mt-0.5">
                          ({b.nights} đêm)
                        </div>
                      </td>

                      {/* Price & Payment Status */}
                      <td className="py-4 px-6">
                        <div className="font-black text-on-surface">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(b.total_price)}
                        </div>
                        <div className="mt-1">
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
                        </div>
                      </td>

                      {/* Booking Status Badge */}
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

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        {canCancel ? (
                          <button
                            onClick={() => openCancelModal(b)}
                            className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-rose-100 hover:text-rose-700 text-outline text-xs font-bold transition-all cursor-pointer"
                          >
                            Hủy đơn
                          </button>
                        ) : (
                          <span className="text-xs text-outline/50 italic">—</span>
                        )}
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
          <div className="p-4 sm:p-5 border-t border-outline-variant/20 flex items-center justify-between gap-4">
            <span className="text-xs text-outline">
              Trang <strong className="text-on-surface">{currentPage}</strong> trên{' '}
              <strong className="text-on-surface">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 rounded-xl border border-outline-variant/30 text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Trước</span>
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-xl border border-outline-variant/30 text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
              >
                <span>Sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. CANCEL BOOKING MODAL */}
      {cancelingBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-outline-variant/30 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-lg">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Xác Nhận Hủy Đơn Đặt Phòng</span>
              </div>
              <button
                onClick={closeCancelModal}
                className="p-1 rounded-full text-outline hover:text-on-surface hover:bg-surface-container"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-on-surface-variant">
              <p>
                Quý đối tác đang thực hiện hủy đơn giữ chỗ{' '}
                <strong className="text-on-surface font-mono">
                  {cancelingBooking.booking_code}
                </strong>{' '}
                của khách hàng{' '}
                <strong className="text-on-surface">{cancelingBooking.guest_name}</strong>.
              </p>
              <div className="p-3 bg-surface-container rounded-2xl space-y-1 text-xs">
                <div>
                  <span className="text-outline">Cơ sở: </span>
                  <span className="font-semibold text-on-surface">
                    {cancelingBooking.property_name || 'Khách sạn liên kết'}
                  </span>
                </div>
                <div>
                  <span className="text-outline">Thời gian: </span>
                  <span className="font-semibold text-on-surface">
                    {cancelingBooking.check_in} → {cancelingBooking.check_out}
                  </span>
                </div>
                <div>
                  <span className="text-outline">Tổng giá trị đơn: </span>
                  <span className="font-bold text-primary">
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
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Lý do hủy đơn <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Nhập lý do hủy (ví dụ: Khách hàng yêu cầu hủy phòng, Quá hạn thanh toán giữ chỗ...)"
                  value={cancelReason}
                  onChange={(e) => {
                    setCancelReason(e.target.value);
                    if (cancelError) setCancelError(null);
                  }}
                  className="w-full p-3 rounded-2xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface placeholder:text-outline focus:border-primary focus:outline-hidden resize-none font-medium"
                  required
                />
              </div>

              {cancelError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                  {cancelError}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCancelModal}
                  className="flex-1 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface transition-colors cursor-pointer"
                >
                  Đóng
                </button>

                <button
                  type="submit"
                  disabled={updateStatusMutation.isPending}
                  className="flex-1 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {updateStatusMutation.isPending ? 'Đang xử lý...' : 'Xác nhận hủy đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

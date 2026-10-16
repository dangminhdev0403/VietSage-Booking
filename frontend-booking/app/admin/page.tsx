'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  Ban,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useBookingsQuery, useUpdateBookingStatusMutation } from '@/features/bookings/hooks/use-bookings';
import { backendFetch } from '@/lib/api/backend';

export default function AdminPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const { data: bookingsData, isLoading, refetch } = useBookingsQuery({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });

  const updateStatusMutation = useUpdateBookingStatusMutation();

  const handleSyncVietSage = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await backendFetch('api/v1/vietsage/sync', {
        method: 'POST',
        body: JSON.stringify({ sync_type: 'all' }),
      });
      const data = await res.json();
      setSyncFeedback(data.data?.message || 'Đồng bộ với VietSage PMS thành công!');
      refetch();
    } catch (err: any) {
      setSyncFeedback('Đồng bộ thất bại: ' + (err.message || 'Lỗi kết nối'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus });
      refetch();
    } catch (err: any) {
      alert('Không thể cập nhật trạng thái: ' + err.message);
    }
  };

  const bookings = bookingsData?.items || [];
  const totalRevenue = bookings.reduce((sum, b) => sum + b.total_price, 0);

  return (
    <div className="max-w-[1320px] mx-auto px-6 lg:px-12 py-10 space-y-8">
      {/* Top Banner (Aurum Haven Quiet Luxury Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="text-[11px] uppercase tracking-widest text-primary font-bold">Kênh Đối Tác & Điều Hành</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-on-surface mt-1">
            Quản Trị Đặt Phòng Aurum Haven & VietSage PMS
          </h1>
          <p className="text-xs text-outline mt-1">
            Điều hành đặt phòng, đối soát doanh thu và liên kết thời gian thực với VietSage PMS.
          </p>
        </div>

        <button
          onClick={handleSyncVietSage}
          disabled={isSyncing}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ VietSage PMS'}</span>
        </button>
      </div>

      {syncFeedback && (
        <div className="p-4 rounded-2xl bg-primary-container/20 border border-primary/30 text-primary text-xs font-medium flex items-center justify-between">
          <span>{syncFeedback}</span>
          <button onClick={() => setSyncFeedback(null)} className="text-primary font-bold">✕</button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-outline uppercase tracking-wider font-semibold block">Tổng Đơn Đặt Phòng</span>
            <span className="font-serif text-3xl font-bold text-on-surface">{bookings.length}</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-outline uppercase tracking-wider font-semibold block">Doanh Thu Tổng</span>
            <span className="font-serif text-2xl font-bold text-primary">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue)}
            </span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-outline uppercase tracking-wider font-semibold block">Kết Nối Hệ Thống</span>
            <span className="text-xs font-bold text-tertiary flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
              VietSage PMS Online
            </span>
          </div>
        </div>
      </div>

      {/* Bookings Management Table */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-on-surface">Danh Sách Đơn Đặt Phòng</h3>
            <p className="text-xs text-outline mt-0.5">Quản lý và cập nhật tiến trình của từng đơn đặt phòng.</p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {['ALL', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-all ${
                  statusFilter === st
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-outline text-xs">Đang tải danh sách đặt phòng...</div>
        ) : bookings.length === 0 ? (
          <div className="p-16 text-center text-outline text-xs">Chưa có đơn đặt phòng nào phù hợp bộ lọc.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-outline uppercase tracking-wider text-[10px] font-bold border-b border-outline-variant/20">
                <tr>
                  <th className="py-3.5 px-6">Mã Đặt</th>
                  <th className="py-3.5 px-6">Khách Sạn</th>
                  <th className="py-3.5 px-6">Khách Hàng</th>
                  <th className="py-3.5 px-6">Thời Gian</th>
                  <th className="py-3.5 px-6">Tổng Tiền</th>
                  <th className="py-3.5 px-6">Trạng Thái</th>
                  <th className="py-3.5 px-6 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-on-surface">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-container/40 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-primary">
                      {b.booking_code}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-on-surface">{b.property_name}</div>
                      <div className="text-[11px] text-outline">{b.room_type_name || 'Tiêu chuẩn'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-on-surface">{b.guest_name}</div>
                      <div className="text-[11px] text-outline">{b.guest_phone}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div>{b.check_in} → {b.check_out}</div>
                      <div className="text-[11px] text-outline font-medium">({b.nights} đêm)</div>
                    </td>
                    <td className="py-4 px-6 font-serif font-bold text-on-surface">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(b.total_price)}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
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
                    <td className="py-4 px-6 text-right space-x-1.5">
                      {b.status === 'PENDING' && (
                        <button
                          onClick={() => handleStatusChange(b.id, 'CONFIRMED')}
                          className="px-3 py-1 bg-primary hover:bg-primary-container text-on-primary rounded-full text-[11px] font-semibold transition-all"
                        >
                          Xác nhận
                        </button>
                      )}
                      {b.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleStatusChange(b.id, 'CHECKED_IN')}
                          className="px-3 py-1 bg-secondary hover:opacity-90 text-on-secondary rounded-full text-[11px] font-semibold transition-all"
                        >
                          Check-in
                        </button>
                      )}
                      {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleStatusChange(b.id, 'CANCELLED')}
                          className="px-3 py-1 bg-surface-container hover:bg-rose-100 hover:text-rose-700 text-outline rounded-full text-[11px] font-semibold transition-all"
                        >
                          Hủy
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

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
    <div className="max-w-[1360px] mx-auto px-6 lg:px-10 py-12 space-y-10">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/30 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="text-xs uppercase tracking-wider text-primary font-bold">Kênh Đối Tác & Điều Hành</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface mt-2">
            Quản Trị Đặt Phòng Aurum Haven & VietSage PMS
          </h1>
          <p className="text-sm text-outline mt-1.5">
            Điều hành đặt phòng, đối soát doanh thu và liên kết thời gian thực với VietSage PMS.
          </p>
        </div>

        <button
          onClick={handleSyncVietSage}
          disabled={isSyncing}
          className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container text-sm font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ VietSage PMS'}</span>
        </button>
      </div>

      {syncFeedback && (
        <div className="p-5 rounded-2xl bg-primary-container/20 border border-primary/30 text-primary text-sm font-semibold flex items-center justify-between">
          <span>{syncFeedback}</span>
          <button onClick={() => setSyncFeedback(null)} className="text-primary font-bold text-base cursor-pointer">✕</button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-outline uppercase tracking-wider font-bold block">Tổng Đơn Đặt Phòng</span>
            <span className="text-3xl sm:text-4xl font-black text-on-surface">{bookings.length}</span>
          </div>
        </div>

        <div className="p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-outline uppercase tracking-wider font-bold block">Doanh Thu Tổng</span>
            <span className="text-3xl sm:text-4xl font-black text-primary">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue)}
            </span>
          </div>
        </div>

        <div className="p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-outline uppercase tracking-wider font-bold block">Kết Nối Hệ Thống</span>
            <span className="text-sm font-bold text-tertiary flex items-center gap-2 mt-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse"></span>
              VietSage PMS Online
            </span>
          </div>
        </div>
      </div>

      {/* Bookings Management Table */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="p-7 border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h3 className="text-xl font-bold text-on-surface">Danh Sách Đơn Đặt Phòng</h3>
            <p className="text-sm text-outline mt-1">Quản lý và cập nhật tiến trình của từng đơn đặt phòng.</p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 text-xs">
            {['ALL', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 text-center text-outline text-sm">Đang tải danh sách đặt phòng...</div>
        ) : bookings.length === 0 ? (
          <div className="p-20 text-center text-outline text-sm">Chưa có đơn đặt phòng nào phù hợp bộ lọc.</div>
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
                    <td className="py-4.5 px-6 font-mono font-extrabold text-primary">
                      {b.booking_code}
                    </td>
                    <td className="py-4.5 px-6">
                      <div className="font-bold text-on-surface">{b.property_name}</div>
                      <div className="text-xs text-outline">{b.room_type_name || 'Tiêu chuẩn'}</div>
                    </td>
                    <td className="py-4.5 px-6">
                      <div className="font-semibold text-on-surface">{b.guest_name}</div>
                      <div className="text-xs text-outline">{b.guest_phone}</div>
                    </td>
                    <td className="py-4.5 px-6">
                      <div className="font-medium">{b.check_in} → {b.check_out}</div>
                      <div className="text-xs text-outline font-medium">({b.nights} đêm)</div>
                    </td>
                    <td className="py-4.5 px-6 font-black text-on-surface">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(b.total_price)}
                    </td>
                    <td className="py-4.5 px-6">
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
                    <td className="py-4.5 px-6 text-right space-x-2">
                      {b.status === 'PENDING' && (
                        <button
                          onClick={() => handleStatusChange(b.id, 'CONFIRMED')}
                          className="px-3.5 py-1.5 bg-primary hover:bg-primary-container text-on-primary rounded-full text-xs font-bold transition-all cursor-pointer"
                        >
                          Xác nhận
                        </button>
                      )}
                      {b.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleStatusChange(b.id, 'CHECKED_IN')}
                          className="px-3.5 py-1.5 bg-secondary hover:opacity-90 text-on-secondary rounded-full text-xs font-bold transition-all cursor-pointer"
                        >
                          Check-in
                        </button>
                      )}
                      {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleStatusChange(b.id, 'CANCELLED')}
                          className="px-3.5 py-1.5 bg-surface-container hover:bg-rose-100 hover:text-rose-700 text-outline rounded-full text-xs font-bold transition-all cursor-pointer"
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

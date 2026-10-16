'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Calendar,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { useBookingsQuery, useUpdateBookingStatusMutation } from '@/features/bookings/hooks/use-bookings';

export default function AdminPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: bookingsData, isLoading, error, refetch } = useBookingsQuery({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });

  const updateStatusMutation = useUpdateBookingStatusMutation();

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (newStatus !== 'CANCELLED') return;
    if (!confirm('Bạn có chắc chắn muốn hủy đơn đặt phòng PENDING này?')) return;
    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus });
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
      alert('Không thể cập nhật trạng thái: ' + msg);
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
            <span className="text-xs uppercase tracking-wider text-primary font-bold">Kênh Điều Hành Nội Bộ (OTA Scope)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface mt-2">
            Quản Trị Đặt Phòng VietSageBooking
          </h1>
          <p className="text-sm text-outline mt-1.5 max-w-2xl leading-relaxed">
            Giám sát yêu cầu đặt chỗ và doanh thu toàn hệ thống. Thao tác xác nhận phòng và check-in/out thuộc thẩm quyền trực tiếp của đối tác lưu trú qua PMS.
          </p>
        </div>
      </div>

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
              Cổng Đối Tác Trực Tuyến
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
        ) : error ? (
          <div className="p-16 text-center space-y-4">
            <div className="text-sm font-semibold text-outline max-w-md mx-auto leading-relaxed">
              Yêu cầu xác thực tài khoản Quản trị viên (ADMIN) để xem danh sách và giám sát các đơn lưu trú.
            </div>
            <Link
              href="/login"
              className="inline-block px-6 py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
            >
              Đăng Nhập Quản Trị
            </Link>
          </div>
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
                    <td className="py-4.5 px-6 text-right">
                      {b.status === 'PENDING' ? (
                        <button
                          onClick={() => handleStatusChange(b.id, 'CANCELLED')}
                          className="px-4 py-1.5 bg-surface-container hover:bg-rose-100 hover:text-rose-700 text-outline rounded-full text-xs font-bold transition-all cursor-pointer"
                        >
                          Hủy đơn
                        </button>
                      ) : (
                        <span className="text-xs text-outline/60 italic">—</span>
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

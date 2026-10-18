'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  CreditCard,
  RefreshCw,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { usePaymentsQuery } from '@/features/payments/hooks/use-payments';

export default function AdminPaymentsPage() {
  const { data: session, status: authStatus } = useSession();

  const user = session?.user as
    | {
        managedPropertyId?: string | null;
      }
    | undefined;

  const managedPropertyId = user?.managedPropertyId ?? undefined;

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'FAILED'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const {
    data: paymentsData,
    isLoading,
    error,
    refetch,
  } = usePaymentsQuery(
    {
      property_id: managedPropertyId,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      page: currentPage,
      pageSize,
    },
    { enabled: authStatus === 'authenticated' },
  );

  const payments = paymentsData?.items || [];
  const totalItems = paymentsData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 text-outline text-xs font-bold uppercase tracking-wider">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Đối Soát &amp; Tài Chính OTA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight mt-1">
            Lịch Sử Giao Dịch Thanh Toán
          </h1>
          <p className="text-xs sm:text-sm text-outline mt-1">
            Theo dõi dòng tiền thanh toán trực tuyến, đối soát giao dịch chuyển khoản VietQR và thanh toán thẻ
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="px-4 py-2.5 rounded-2xl bg-surface-container-lowest text-on-surface border border-outline-variant/30 shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 text-xs font-bold cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-primary" />
          <span>Làm mới giao dịch</span>
        </button>
      </div>

      {/* 2. SUMMARY STRIP & FILTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-2xs">
          <span className="text-xs uppercase font-bold text-outline tracking-wider block">
            Tổng Số Giao Dịch
          </span>
          <div className="text-2xl font-black text-on-surface mt-1">{totalItems}</div>
          <span className="text-xs text-outline font-medium mt-0.5 block">
            Giao dịch thanh toán được ghi nhận
          </span>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-2xs">
          <span className="text-xs uppercase font-bold text-outline tracking-wider block">
            Giá Trị Trên Trang Này
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(totalAmount)}
          </div>
          <span className="text-xs text-outline font-medium mt-0.5 block">
            Tổng tiền {payments.length} bản ghi
          </span>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-2xs">
          <span className="text-xs uppercase font-bold text-outline tracking-wider block">
            Phương Thức Chủ Đạo
          </span>
          <div className="text-2xl font-black text-primary mt-1">VietQR / Stripe</div>
          <span className="text-xs text-outline font-medium mt-0.5 block">
            Cổng thanh toán tự động
          </span>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-surface-container-lowest rounded-3xl p-4 border border-outline-variant/30 shadow-2xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-outline mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Lọc trạng thái:</span>
          </span>

          {(['ALL', 'PAID', 'PENDING', 'FAILED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setStatusFilter(tab);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-primary text-on-primary shadow-2xs'
                  : 'bg-surface-container text-outline hover:text-on-surface'
              }`}
            >
              {tab === 'ALL'
                ? 'Tất cả'
                : tab === 'PAID'
                ? 'Thành công (PAID)'
                : tab === 'PENDING'
                ? 'Đang chờ'
                : 'Thất bại'}
            </button>
          ))}
        </div>

        <span className="text-xs text-outline font-medium">
          Trang <strong>{currentPage}</strong> / {totalPages}
        </span>
      </div>

      {/* 3. TRANSACTIONS TABLE */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-outline font-medium">Đang tải lịch sử giao dịch...</p>
          </div>
        ) : error ? (
          <div className="p-16 text-center space-y-4">
            <div className="text-sm font-semibold text-rose-600 max-w-md mx-auto">
              Không thể tải lịch sử thanh toán. Vui lòng kiểm tra lại kết nối.
            </div>
            <button
              onClick={() => refetch()}
              className="px-5 py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface"
            >
              Thử lại
            </button>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-24 text-center text-outline text-xs">
            Chưa có giao dịch thanh toán nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low text-outline uppercase tracking-wider text-xs font-bold border-b border-outline-variant/20">
                <tr>
                  <th className="py-4 px-6">Mã Đơn</th>
                  <th className="py-4 px-6">Mã Giao Dịch</th>
                  <th className="py-4 px-6">Khách Hàng &amp; Cơ Sở</th>
                  <th className="py-4 px-6">Số Tiền</th>
                  <th className="py-4 px-6">Phương Thức</th>
                  <th className="py-4 px-6">Trạng Thái</th>
                  <th className="py-4 px-6 text-right">Thời Gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-on-surface">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-container/50 transition-colors">
                    {/* Booking Code */}
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-primary">
                        {p.booking_code || '—'}
                      </span>
                    </td>

                    {/* Transaction Ref */}
                    <td className="py-4 px-6">
                      <div className="font-mono text-xs text-on-surface truncate max-w-[160px]" title={p.transaction_ref || p.id}>
                        {p.transaction_ref || p.id}
                      </div>
                    </td>

                    {/* Guest & Property */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-on-surface">{p.guest_name || 'Khách hàng'}</div>
                      <div className="text-xs text-outline flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-primary shrink-0" />
                        <span className="truncate max-w-[150px]">{p.property_name || 'Cơ sở lưu trú'}</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-6 font-black text-on-surface">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(p.amount)}
                    </td>

                    {/* Payment Method */}
                    <td className="py-4 px-6">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-surface-container text-on-surface">
                        {p.payment_method}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        {p.status === 'PAID' || p.status === 'SUCCESS' ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-xs font-bold text-emerald-700 uppercase">
                              Thành Công
                            </span>
                          </>
                        ) : p.status === 'PENDING' ? (
                          <>
                            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="text-xs font-bold text-amber-700 uppercase">
                              Chờ Xử Lý
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span className="text-xs font-bold text-rose-700 uppercase">
                              {p.status}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-4 px-6 text-right">
                      <div className="text-xs font-medium text-on-surface">
                        {new Date(p.created_at).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="text-xs text-outline mt-0.5">
                        {new Date(p.created_at).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
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
    </div>
  );
}

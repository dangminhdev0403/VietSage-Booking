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
  Eye,
  X,
  Copy,
  Check,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { usePaymentsQuery } from '@/features/payments/hooks/use-payments';
import { usePropertiesQuery } from '@/features/catalog/hooks/use-catalog';
import { luxuryAlert } from '@/lib/alert/luxury-alert';

export default function AdminPaymentsPage() {
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
      property_id: effectivePropertyId,
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

  // In-place Payment Detail Modal State
  const [selectedPayment, setSelectedPayment] = useState<(typeof payments)[number] | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyText = async (text: string, key: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      luxuryAlert.toast(`Đã sao chép ${label}`, 'success');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 text-outline text-xs font-bold uppercase tracking-wider">
            <CreditCard className={`w-4 h-4 ${isPartner ? 'text-emerald-600' : 'text-primary'}`} />
            <span className={isPartner ? 'text-emerald-700' : 'text-primary'}>
              {isPartner ? 'Kênh Đối Tác' : 'Kênh Quản Trị OTA'}
            </span>
            {isPartner && managedPropertyName && (
              <>
                <span className="text-outline-variant">•</span>
                <span className="text-emerald-950 font-bold">{managedPropertyName}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight mt-1 text-balance">
            Doanh Thu &amp; Thanh Toán
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          {!managedPropertyId && properties.length > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-2xs">
              <Building2 className="w-4 h-4 text-primary shrink-0" />
              <select
                value={adminSelectedPropertyId}
                onChange={(e) => {
                  setAdminSelectedPropertyId(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs font-bold text-on-surface focus:outline-none cursor-pointer max-w-[200px] truncate"
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
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2.5 rounded-2xl bg-surface-container-lowest text-on-surface border border-outline-variant/30 shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 text-xs font-bold cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-primary" />
            <span>Làm mới giao dịch</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY STRIP (KPI STAT CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-2xs">
          <span className="text-xs uppercase font-bold text-outline tracking-wider block">
            {isPartner ? 'Giao Dịch Cọc Cơ Sở' : 'Tổng Giao Dịch Toàn Sàn'}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-on-surface mt-1">{totalItems}</div>
          <span className="text-xs text-outline font-medium mt-0.5 block">
            {isPartner ? 'Lượt khách đặt cọc tại khách sạn' : 'Giao dịch thanh toán được ghi nhận'}
          </span>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-2xs">
          <span className="text-xs uppercase font-bold text-outline tracking-wider block">
            {isPartner ? 'Tổng Tiền Cọc 30% Đã Nhận' : 'Giá Trị Trên Trang Này'}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(totalAmount)}
          </div>
          <span className="text-xs text-outline font-medium mt-0.5 block">
            Tổng tiền {payments.length} bản ghi hiển thị
          </span>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-2xs">
          <span className="text-xs uppercase font-bold text-outline tracking-wider block">
            Phương Thức Chủ Đạo
          </span>
          <div className="text-2xl sm:text-3xl font-black text-primary mt-1">Chuyển khoản / Stripe</div>
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
              type="button"
              onClick={() => {
                setStatusFilter(tab);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab
                  ? isPartner
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-primary text-on-primary shadow-xs'
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
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xs overflow-hidden min-h-[420px] flex flex-col justify-between">
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
              type="button"
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
                  <th className="py-3.5 px-5 w-[140px] whitespace-nowrap">Mã Đơn</th>
                  <th className="py-3.5 px-5 w-[180px] whitespace-nowrap">Mã Giao Dịch</th>
                  <th className="py-3.5 px-5 min-w-[200px]">Khách Hàng &amp; Cơ Sở</th>
                  <th className="py-3.5 px-5 w-[150px] text-right whitespace-nowrap">Số Tiền</th>
                  <th className="py-3.5 px-5 w-[140px] text-center whitespace-nowrap">Phương Thức</th>
                  <th className="py-3.5 px-5 w-[140px] whitespace-nowrap">Trạng Thái</th>
                  <th className="py-3.5 px-5 w-[130px] text-right whitespace-nowrap">Thời Gian</th>
                  <th className="py-3.5 px-5 w-[120px] text-right whitespace-nowrap">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-on-surface">
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedPayment(p)}
                    className="hover:bg-surface-container-low/60 cursor-pointer transition-colors group"
                    title="Nhấn để xem toàn bộ chi tiết giao dịch"
                  >
                    {/* Booking Code */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                        {p.booking_code || '—'}
                      </span>
                    </td>

                    {/* Transaction Ref */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <div className="font-mono text-xs text-on-surface truncate max-w-[160px]" title={p.transaction_ref || p.id}>
                        {p.transaction_ref || p.id}
                      </div>
                    </td>

                    {/* Guest & Property */}
                    <td className="py-4 px-5">
                      <div className="font-bold text-on-surface text-sm">{p.guest_name || 'Khách hàng'}</div>
                      <div className="text-xs text-outline flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate max-w-[200px]" title={p.property_name || 'Cơ sở lưu trú'}>
                          {p.property_name || 'Cơ sở lưu trú'}
                        </span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-5 font-black text-on-surface text-right whitespace-nowrap">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(p.amount)}
                    </td>

                    {/* Payment Method */}
                    <td className="py-4 px-5 text-center whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-surface-container text-on-surface border border-outline-variant/20">
                        {p.payment_method}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {p.status === 'PAID' || p.status === 'SUCCESS' ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-xs font-bold text-emerald-700 uppercase whitespace-nowrap">
                              Thành Công
                            </span>
                          </>
                        ) : p.status === 'PENDING' ? (
                          <>
                            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="text-xs font-bold text-amber-700 uppercase whitespace-nowrap">
                              Chờ Xử Lý
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span className="text-xs font-bold text-rose-700 uppercase whitespace-nowrap">
                              {p.status}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
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

                    {/* Actions */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPayment(p);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs border border-outline-variant/30 transition-all inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-primary" />
                        <span>Chi tiết</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 sm:p-5 border-t border-outline-variant/20 flex items-center justify-between gap-4 mt-auto">
            <span className="text-xs text-outline font-medium">
              Trang <strong className="text-on-surface">{currentPage}</strong> trên{' '}
              <strong className="text-on-surface">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 rounded-xl border border-outline-variant/30 text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Trước</span>
              </button>

              <button
                type="button"
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

      {/* IN-PLACE MODAL: Chi Tiết Giao Dịch Thanh Toán */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-transparent"
            onClick={() => setSelectedPayment(null)}
          />

          <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-outline-variant/20 flex items-center justify-between shrink-0 bg-surface-container-low/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface text-balance">
                    Chi Tiết Giao Dịch Thanh Toán
                  </h3>
                  <p className="text-xs text-outline font-mono truncate max-w-[280px] sm:max-w-md">
                    Mã GD: {selectedPayment.transaction_ref || selectedPayment.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 sm:p-7 space-y-5 overflow-y-auto flex-1">
              {/* Prominent Amount & Status Card */}
              <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs uppercase font-bold text-outline tracking-wider block">
                    Số Tiền Giao Dịch
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-0.5">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(selectedPayment.amount)}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-surface-container text-on-surface border border-outline-variant/30 whitespace-nowrap">
                    {selectedPayment.payment_method}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
                      selectedPayment.status === 'PAID' || selectedPayment.status === 'SUCCESS'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : selectedPayment.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        selectedPayment.status === 'PAID' || selectedPayment.status === 'SUCCESS'
                          ? 'bg-emerald-500'
                          : selectedPayment.status === 'PENDING'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                    <span>
                      {selectedPayment.status === 'PAID' || selectedPayment.status === 'SUCCESS'
                        ? 'Thành Công'
                        : selectedPayment.status === 'PENDING'
                        ? 'Chờ Xử Lý'
                        : selectedPayment.status}
                    </span>
                  </span>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1">
                  <span className="text-xs font-medium text-outline block">Mã đơn đặt phòng (OTA):</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-primary text-sm truncate">
                      {selectedPayment.booking_code || '—'}
                    </span>
                    {selectedPayment.booking_code && (
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(selectedPayment.booking_code!, 'booking_code', 'Mã đơn đặt phòng')
                        }
                        className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container cursor-pointer"
                        title="Sao chép mã đơn"
                      >
                        {copiedKey === 'booking_code' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1">
                  <span className="text-xs font-medium text-outline block">Mã tham chiếu giao dịch:</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-on-surface text-xs truncate" title={selectedPayment.transaction_ref || selectedPayment.id}>
                      {selectedPayment.transaction_ref || selectedPayment.id}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(
                          selectedPayment.transaction_ref || selectedPayment.id,
                          'txn_ref',
                          'Mã giao dịch',
                        )
                      }
                      className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container cursor-pointer"
                      title="Sao chép mã giao dịch"
                    >
                      {copiedKey === 'txn_ref' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1">
                  <span className="text-xs font-medium text-outline block">Khách hàng thực hiện:</span>
                  <span className="font-bold text-on-surface text-sm block">
                    {selectedPayment.guest_name || 'Khách vãng lai'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1">
                  <span className="text-xs font-medium text-outline block">Cơ sở lưu trú tiếp nhận:</span>
                  <div className="flex items-center gap-1.5 font-bold text-on-surface text-sm">
                    <Building2 className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate">{selectedPayment.property_name || 'Cơ sở lưu trú'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1">
                  <span className="text-xs font-medium text-outline block">Thời gian ghi nhận:</span>
                  <span className="font-semibold text-slate-800 text-xs block">
                    {new Date(selectedPayment.created_at).toLocaleString('vi-VN', {
                      timeZone: 'Asia/Ho_Chi_Minh',
                    })}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1">
                  <span className="text-xs font-medium text-outline block">Phương thức thanh toán:</span>
                  <span className="font-bold text-on-surface text-xs block uppercase">
                    {selectedPayment.payment_method}
                  </span>
                </div>
              </div>

              {/* Informative Security & Reconciliation Notice */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 text-xs text-outline flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                <span className="text-pretty">
                  Giao dịch được đối soát trực tiếp qua cổng thanh toán bảo mật. Mọi thay đổi trạng thái được ghi nhận đồng bộ vào sổ cái tài chính OTA.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-outline-variant/20 bg-surface-container-low/40 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-outline hover:text-on-surface hover:bg-surface-container cursor-pointer transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

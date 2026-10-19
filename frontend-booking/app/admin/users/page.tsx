'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Clock,
  UserCheck,
  X,
  Save,
  Loader2,
  Lock,
  Unlock,
  Eye,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Calendar,
  MapPin,
} from 'lucide-react';
import {
  useUsersQuery,
  useApprovePartnerMutation,
  useUpdateUserRoleMutation,
} from '@/features/users/hooks/use-users';
import { usePropertiesQuery } from '@/features/catalog/hooks/use-catalog';
import { luxuryAlert } from '@/lib/alert/luxury-alert';
import type { UserItem } from '@/features/users/service/users.client';

type TabType = 'all' | 'pending' | 'partners' | 'admins' | 'travelers';

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Compute filter for useUsersQuery
  const queryFilter = useMemo(() => {
    let role: 'ALL' | 'ADMIN' | 'HOTEL_PARTNER' | 'TRAVELER' = 'ALL';
    let status: 'all' | 'active' | 'inactive' | 'pending' = statusFilter;

    if (activeTab === 'pending') {
      status = 'pending';
    } else if (activeTab === 'partners') {
      role = 'HOTEL_PARTNER';
    } else if (activeTab === 'admins') {
      role = 'ADMIN';
    } else if (activeTab === 'travelers') {
      role = 'TRAVELER';
    }

    return {
      role,
      status,
      search: searchKeyword.trim() || undefined,
      page,
      pageSize,
    };
  }, [activeTab, searchKeyword, statusFilter, page, pageSize]);

  const { data, isLoading, refetch } = useUsersQuery(queryFilter);
  const { data: propertiesData } = usePropertiesQuery({ pageSize: 100 });
  const allProperties = propertiesData?.items ?? [];

  const approveMutation = useApprovePartnerMutation();
  const updateRoleMutation = useUpdateUserRoleMutation();

  // In-place Partner Approval Modal State
  const [approvingUser, setApprovingUser] = useState<UserItem | null>(null);
  const [approvalPropertyId, setApprovalPropertyId] = useState<string>('');
  const [isApprovingSubmitting, setIsApprovingSubmitting] = useState(false);

  // In-place Role & Scope Drawer State
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editRole, setEditRole] = useState<'ADMIN' | 'HOTEL_PARTNER' | 'TRAVELER'>('TRAVELER');
  const [editPropertyId, setEditPropertyId] = useState<string>('');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const usersList = data?.items ?? [];

  const summary = data?.summary ?? {
    total_users: 0,
    total_partners: 0,
    total_admins: 0,
    total_pending: 0,
  };

  const totalPages = data?.total_pages || Math.max(1, Math.ceil((data?.total || usersList.length) / pageSize));

  const handleOpenApproveModal = (user: UserItem) => {
    setApprovingUser(user);
    setApprovalPropertyId(user.managed_property_id || '');
  };

  const handleConfirmApproval = async () => {
    if (!approvingUser) return;
    setIsApprovingSubmitting(true);
    try {
      await approveMutation.mutateAsync({
        userId: approvingUser.id,
        payload: {
          managed_property_id: approvalPropertyId || undefined,
          is_active: true,
        },
      });

      await luxuryAlert.success({
        title: 'Phê Duyệt Đối Tác Thành Công',
        message: `Đã cấp vai trò HOTEL_PARTNER cho tài khoản ${approvingUser.display_name} và kích hoạt cơ sở lưu trú liên kết.`,
        confirmText: 'Hoàn Tất',
      });

      setApprovingUser(null);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi phê duyệt đối tác.';
      await luxuryAlert.error({
        title: 'Thao Tác Thất Bại',
        message: msg,
        confirmText: 'Đóng',
      });
    } finally {
      setIsApprovingSubmitting(false);
    }
  };

  const handleOpenEditDrawer = (user: UserItem) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditPropertyId(user.managed_property_id || '');
    setEditIsActive(user.is_active);
  };

  const handleSaveUserRole = async () => {
    if (!editingUser) return;
    if (editingUser.role === 'ADMIN') {
      await luxuryAlert.error({
        title: 'Thao Tác Bị Chặn',
        message: 'Không thể chỉnh sửa tài khoản Quản trị viên cấp cao (ADMIN).',
        confirmText: 'Đóng',
      });
      return;
    }
    setIsEditSubmitting(true);
    try {
      await updateRoleMutation.mutateAsync({
        userId: editingUser.id,
        payload: {
          role: editRole,
          managed_property_id: editRole === 'HOTEL_PARTNER' ? editPropertyId || null : null,
          is_active: editIsActive,
        },
      });

      await luxuryAlert.success({
        title: 'Cập Nhật Vai Trò Thành Công',
        message: `Đã cập nhật vai trò cho người dùng ${editingUser.display_name}.`,
        confirmText: 'Đóng',
      });

      setEditingUser(null);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi cập nhật vai trò.';
      await luxuryAlert.error({
        title: 'Thao Tác Thất Bại',
        message: msg,
        confirmText: 'Đóng',
      });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 text-outline text-xs font-bold uppercase tracking-wider">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-primary">Kênh Quản Trị Hệ Thống</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight mt-1 text-balance">
            Quản Lý Người Dùng &amp; Đối Tác
          </h1>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2.5 rounded-2xl bg-surface-container-lowest text-on-surface border border-outline-variant/30 shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 text-xs font-bold cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-primary" />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {/* 2. SUMMARY STRIP (4 KPI STAT CARDS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng người dùng */}
        <div
          onClick={() => {
            setActiveTab('all');
            setPage(1);
          }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-surface-container-low border-primary/40 shadow-xs'
              : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant/60 shadow-2xs'
          }`}
        >
          <span className="text-xs uppercase font-bold text-outline tracking-wider block">
            Tổng Người Dùng
          </span>
          <div className="text-2xl font-black text-on-surface mt-1">
            {summary.total_users}
          </div>
          <span className="text-xs text-outline font-medium mt-0.5 block">
            Toàn bộ tài khoản trên hệ thống
          </span>
        </div>

        {/* Card 2: Chờ duyệt đối tác */}
        <div
          onClick={() => {
            setActiveTab('pending');
            setPage(1);
          }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-amber-500/10 border-amber-500/40 shadow-xs'
              : 'bg-surface-container-lowest border-outline-variant/30 hover:border-amber-500/30 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-amber-700 tracking-wider block">
              Chờ Duyệt Đối Tác
            </span>
            {summary.total_pending > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-xs font-bold whitespace-nowrap">
                Cần xử lý
              </span>
            )}
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">
            {summary.total_pending}
          </div>
          <span className="text-xs text-outline font-medium mt-0.5 block">
            Hồ sơ đối tác cần phê duyệt
          </span>
        </div>

        {/* Card 3: Đối tác khách sạn */}
        <div
          onClick={() => {
            setActiveTab('partners');
            setPage(1);
          }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'partners'
              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-xs'
              : 'bg-surface-container-lowest border-outline-variant/30 hover:border-emerald-500/30 shadow-2xs'
          }`}
        >
          <span className="text-xs uppercase font-bold text-emerald-700 tracking-wider block">
            Đối Tác Khách Sạn
          </span>
          <div className="text-2xl font-black text-emerald-900 mt-1">
            {summary.total_partners}
          </div>
          <span className="text-xs text-outline font-medium mt-0.5 block">
            Cơ sở lưu trú đã kích hoạt
          </span>
        </div>

        {/* Card 4: Quản trị viên */}
        <div
          onClick={() => {
            setActiveTab('admins');
            setPage(1);
          }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'admins'
              ? 'bg-purple-500/10 border-purple-500/40 shadow-xs'
              : 'bg-surface-container-lowest border-outline-variant/30 hover:border-purple-500/30 shadow-2xs'
          }`}
        >
          <span className="text-xs uppercase font-bold text-purple-700 tracking-wider block">
            Quản Trị Viên
          </span>
          <div className="text-2xl font-black text-purple-900 mt-1">
            {summary.total_admins}
          </div>
          <span className="text-xs text-outline font-medium mt-0.5 block">
            Phân quyền vận hành nền tảng
          </span>
        </div>
      </div>

      {/* 3. TABS & FILTER BAR */}
      <div className="bg-surface-container-lowest rounded-3xl p-4 border border-outline-variant/30 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-outline mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Bộ lọc:</span>
          </span>

          {(['all', 'pending', 'partners', 'admins', 'travelers'] as const).map((tab) => {
            const isActive = activeTab === tab;
            const label =
              tab === 'all'
                ? 'Tất cả người dùng'
                : tab === 'pending'
                ? 'Chờ duyệt đối tác'
                : tab === 'partners'
                ? 'Đối tác khách sạn'
                : tab === 'admins'
                ? 'Quản trị viên'
                : 'Khách hàng (Traveler)';

            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? tab === 'pending'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : tab === 'partners'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : tab === 'admins'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container text-outline hover:text-on-surface'
                }`}
              >
                <span>{label}</span>
                {tab === 'pending' && summary.total_pending > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-xs font-extrabold ${
                      isActive ? 'bg-white text-amber-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {summary.total_pending}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên, email, KS..."
              className="w-full pl-9 pr-3 py-2 bg-surface-container-low rounded-xl border border-outline-variant/30 text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
              setPage(1);
            }}
            className="px-3 py-2 bg-surface-container-low rounded-xl border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none transition-all cursor-pointer whitespace-nowrap"
          >
            <option value="all">Trạng thái: Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Đã tạm khóa</option>
          </select>
        </div>
      </div>

      {/* 4. MAIN USERS TABLE */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xs overflow-hidden min-h-[420px] flex flex-col justify-between">
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-outline font-medium">Đang tải danh sách người dùng...</p>
          </div>
        ) : usersList.length === 0 ? (
          <div className="py-24 text-center space-y-2">
            <Users className="w-10 h-10 text-outline mx-auto stroke-1" />
            <h3 className="text-sm font-bold text-on-surface text-balance">
              Không tìm thấy người dùng phù hợp
            </h3>
            <p className="text-xs text-outline text-pretty">
              Thử thay đổi từ khóa tìm kiếm hoặc điều kiện lọc để hiển thị kết quả.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low text-outline uppercase tracking-wider text-xs font-bold border-b border-outline-variant/20">
                <tr>
                  <th className="py-3.5 px-5 min-w-[220px]">Người Dùng</th>
                  <th className="py-3.5 px-5 w-[160px] whitespace-nowrap">Vai Trò</th>
                  <th className="py-3.5 px-5 min-w-[180px]">Khách Sạn Liên Kết</th>
                  <th className="py-3.5 px-5 w-[140px] whitespace-nowrap">Trạng Thái</th>
                  <th className="py-3.5 px-5 w-[130px] whitespace-nowrap">Ngày Tham Gia</th>
                  <th className="py-3.5 px-5 w-[160px] text-right whitespace-nowrap">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-on-surface">
                {usersList.map((user) => {
                  const roleBadgeClass =
                    user.role === 'ADMIN'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : user.role === 'HOTEL_PARTNER'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : user.pending_approval
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-slate-100 text-slate-700 border-slate-200';

                  const roleLabel =
                    user.role === 'ADMIN'
                      ? 'Platform Admin'
                      : user.role === 'HOTEL_PARTNER'
                      ? 'Đối tác Khách sạn'
                      : user.pending_approval
                      ? 'Chờ duyệt đối tác'
                      : 'Khách hàng (Traveler)';

                  return (
                    <tr
                      key={user.id}
                      onClick={() => handleOpenEditDrawer(user)}
                      className="hover:bg-surface-container-low/60 cursor-pointer transition-colors group"
                      title="Nhấn để xem toàn bộ thông tin & phân quyền tài khoản"
                    >
                      {/* User display name & clean email */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                            {user.display_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-on-surface text-sm truncate max-w-[200px]" title={user.display_name}>
                              {user.display_name}
                            </div>
                            <div className="text-outline text-xs truncate max-w-[200px]" title={user.email}>
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role badge */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${roleBadgeClass}`}
                        >
                          {user.role === 'ADMIN' && <ShieldCheck className="w-3.5 h-3.5" />}
                          {user.role === 'HOTEL_PARTNER' && <Building2 className="w-3.5 h-3.5" />}
                          {user.pending_approval && <Clock className="w-3.5 h-3.5" />}
                          <span>{roleLabel}</span>
                        </span>
                      </td>

                      {/* Managed Hotel (clean, zero redundant city/badge clutter) */}
                      <td className="py-4 px-5">
                        {user.managed_property ? (
                          <div className="flex items-center gap-2 text-on-surface font-semibold text-sm">
                            <Building2 className="w-4 h-4 text-primary shrink-0" />
                            <span className="truncate max-w-[220px]" title={user.managed_property.name}>
                              {user.managed_property.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-outline text-xs italic">Chưa liên kết</span>
                        )}
                      </td>

                      {/* Account status */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                            user.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span>{user.is_active ? 'Hoạt động' : 'Tạm khóa'}</span>
                        </span>
                      </td>

                      {/* Created date */}
                      <td className="py-4 px-5 text-outline text-xs font-medium whitespace-nowrap">
                        {new Date(user.created_at).toLocaleDateString('vi-VN')}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {user.pending_approval && (
                            <button
                              type="button"
                              onClick={() => handleOpenApproveModal(user)}
                              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Duyệt đối tác</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditDrawer(user)}
                            className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs border border-outline-variant/30 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-primary" />
                            <span>{user.role === 'ADMIN' ? 'Chi tiết' : 'Phân quyền'}</span>
                          </button>
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
        <div className="p-4 sm:p-5 border-t border-outline-variant/20 flex items-center justify-between gap-4 mt-auto">
          <span className="text-xs text-outline font-medium">
            Hiển thị <strong>{usersList.length}</strong> / <strong>{data?.total || usersList.length}</strong> tài khoản
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-xl border border-outline-variant/30 text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Trước</span>
              </button>

              <span className="text-xs text-outline font-medium">
                Trang <strong>{page}</strong> / {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-xl border border-outline-variant/30 text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
              >
                <span>Sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* IN-PLACE MODAL: Phê Duyệt Đối Tác Khách Sạn */}
      {approvingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface text-balance">
                    Phê Duyệt Đối Tác Khách Sạn
                  </h3>
                  <span className="text-sm text-outline">
                    Xác nhận cấp quyền vận hành đối tác (HOTEL_PARTNER)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApprovingUser(null)}
                className="p-1 rounded-full text-outline hover:text-on-surface cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-outline text-sm">Người đại diện:</span>
                  <span className="font-semibold text-on-surface text-sm">{approvingUser.display_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-outline text-sm">Tài khoản &amp; Email:</span>
                  <span className="font-medium text-slate-700 text-sm">
                    {approvingUser.email}
                  </span>
                </div>
                {Boolean(approvingUser.registration_metadata?.phone) && (
                  <div className="flex justify-between items-center">
                    <span className="text-outline text-sm">Điện thoại liên hệ:</span>
                    <span className="font-semibold text-slate-700 text-sm">
                      {String(approvingUser.registration_metadata?.phone)}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">
                  Cơ sở lưu trú quản lý
                </label>
                <select
                  value={approvalPropertyId}
                  onChange={(e) => setApprovalPropertyId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30 text-sm font-medium text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
                >
                  {approvingUser.managed_property && (
                    <option value={approvingUser.managed_property.id}>
                      {approvingUser.managed_property.name} ({approvingUser.managed_property.city}) - Đăng ký kèm hồ sơ
                    </option>
                  )}
                  {allProperties
                    .filter((p) => p.id !== approvingUser.managed_property?.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.city})
                      </option>
                    ))}
                </select>
                <span className="text-xs text-outline mt-1.5 block">
                  Kích hoạt mở bán trên sàn OTA và trao quyền quản trị cơ sở lưu trú cho đối tác.
                </span>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setApprovingUser(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-outline hover:text-on-surface cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                disabled={isApprovingSubmitting}
                onClick={handleConfirmApproval}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-semibold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isApprovingSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang duyệt...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác nhận Duyệt Đối Tác</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-PLACE MODAL: Chi Tiết & Phân Quyền Tài Khoản */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          {/* Backdrop dismiss */}
          <div
            className="fixed inset-0 bg-transparent"
            onClick={() => setEditingUser(null)}
          />

          {/* Centered Modal Container */}
          <div className="relative w-full max-w-3xl xl:max-w-4xl bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-outline-variant/20 flex items-center justify-between shrink-0 bg-surface-container-low/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface text-balance">
                    {editingUser.role === 'ADMIN'
                      ? 'Chi Tiết Tài Khoản Quản Trị Viên'
                      : 'Chi Tiết & Phân Quyền Tài Khoản'}
                  </h3>
                  <p className="text-xs text-outline text-pretty">
                    Toàn bộ hồ sơ tài khoản, vai trò và phạm vi hoạt động.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-7 space-y-6 overflow-y-auto flex-1">
              {/* Comprehensive User Overview Card */}
              <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-outline text-xs block font-medium">Họ tên &amp; Người dùng:</span>
                  <span className="font-bold text-on-surface text-sm block mt-0.5">
                    {editingUser.display_name}
                  </span>
                  <span className="text-outline text-xs block font-mono">
                    @{editingUser.username}
                  </span>
                </div>

                <div>
                  <span className="text-outline text-xs block font-medium">Email liên hệ:</span>
                  <span className="font-semibold text-slate-800 text-sm block mt-0.5 break-all">
                    {editingUser.email}
                  </span>
                  {Boolean(editingUser.registration_metadata?.phone) && (
                    <span className="text-outline text-xs block mt-0.5">
                      SĐT: {String(editingUser.registration_metadata?.phone)}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-outline text-xs block font-medium">Vai trò &amp; Trạng thái:</span>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${
                        editingUser.role === 'HOTEL_PARTNER'
                          ? 'bg-emerald-100 text-emerald-800'
                          : editingUser.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {editingUser.role}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                        editingUser.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {editingUser.is_active ? 'Hoạt động' : 'Tạm khóa'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-outline text-xs block font-medium">Ngày khởi tạo:</span>
                  <span className="text-slate-800 text-xs font-semibold block mt-0.5">
                    {new Date(editingUser.created_at).toLocaleString('vi-VN', {
                      timeZone: 'Asia/Ho_Chi_Minh',
                    })}
                  </span>
                </div>

                <div>
                  <span className="text-outline text-xs block font-medium">Cập nhật gần nhất:</span>
                  <span className="text-slate-800 text-xs font-semibold block mt-0.5">
                    {new Date(editingUser.updated_at).toLocaleString('vi-VN', {
                      timeZone: 'Asia/Ho_Chi_Minh',
                    })}
                  </span>
                </div>

                {editingUser.managed_property && (
                  <div>
                    <span className="text-outline text-xs block font-medium">Cơ sở liên kết:</span>
                    <span className="text-slate-800 text-xs font-bold block mt-0.5">
                      {editingUser.managed_property.name} ({editingUser.managed_property.city})
                    </span>
                  </div>
                )}
              </div>

              {/* ADMIN ACCOUNT: Security Notice */}
              {editingUser.role === 'ADMIN' ? (
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-200 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="text-sm font-bold text-purple-900">
                      Tài Khoản Quản Trị Hệ Thống Cấp Cao (PLATFORM_ADMIN)
                    </div>
                    <p className="text-xs text-purple-700 leading-relaxed">
                      Tài khoản này sở hữu quyền quản trị hạ tầng, cơ sở dữ liệu và vận hành hệ thống OTA. Nhằm đảm bảo an toàn phân quyền, tài khoản Quản trị viên chỉ có thể xem chi tiết và không thể sửa đổi vai trò qua giao diện quản trị này.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Roles Section (2-Column Horizontal Grid) */}
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">
                      Vai trò hệ thống (Role)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* HOTEL_PARTNER */}
                      <label
                        onClick={() => setEditRole('HOTEL_PARTNER')}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                          editRole === 'HOTEL_PARTNER'
                            ? 'border-2 border-emerald-600 bg-emerald-500/10 shadow-xs'
                            : 'border border-outline-variant/30 bg-surface-container-low hover:border-outline-variant/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                editRole === 'HOTEL_PARTNER'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-surface-container text-outline'
                              }`}
                            >
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-sm text-on-surface block text-balance">
                                Đối tác Khách sạn
                              </span>
                              <span className="text-xs font-mono text-outline block whitespace-nowrap">
                                HOTEL_PARTNER
                              </span>
                            </div>
                          </div>
                          <input
                            type="radio"
                            name="userRole"
                            checked={editRole === 'HOTEL_PARTNER'}
                            onChange={() => setEditRole('HOTEL_PARTNER')}
                            className="mt-0.5 text-emerald-600 cursor-pointer"
                          />
                        </div>
                        <p className="text-xs text-outline text-pretty leading-relaxed">
                          Quản lý phòng, lịch allotment, bảng giá và đơn đặt trong phạm vi cơ sở lưu trú được gán.
                        </p>
                      </label>

                      {/* TRAVELER */}
                      <label
                        onClick={() => setEditRole('TRAVELER')}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                          editRole === 'TRAVELER'
                            ? 'border-2 border-slate-600 bg-slate-500/10 shadow-xs'
                            : 'border border-outline-variant/30 bg-surface-container-low hover:border-outline-variant/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                editRole === 'TRAVELER'
                                  ? 'bg-slate-700 text-white'
                                  : 'bg-surface-container text-outline'
                              }`}
                            >
                              <Users className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-sm text-on-surface block text-balance">
                                Khách Hàng (Traveler)
                              </span>
                              <span className="text-xs font-mono text-outline block whitespace-nowrap">
                                TRAVELER
                              </span>
                            </div>
                          </div>
                          <input
                            type="radio"
                            name="userRole"
                            checked={editRole === 'TRAVELER'}
                            onChange={() => setEditRole('TRAVELER')}
                            className="mt-0.5 text-slate-600 cursor-pointer"
                          />
                        </div>
                        <p className="text-xs text-outline text-pretty leading-relaxed">
                          Đặt phòng, thanh toán và quản lý lịch sử lưu trú cá nhân trên sàn OTA.
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* Lower 2-Column Section: Scope Boundary & Account Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-outline-variant/20">
                    {/* Scope Boundary */}
                    <div>
                      <label className="block text-sm font-semibold text-on-surface mb-1.5">
                        Khách sạn quản lý (Scope Boundary)
                      </label>
                      {editRole === 'HOTEL_PARTNER' ? (
                        <div className="space-y-1.5">
                          <div className="relative">
                            <Building2 className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <select
                              value={editPropertyId}
                              onChange={(e) => setEditPropertyId(e.target.value)}
                              className="w-full pl-10 pr-3.5 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30 text-sm font-medium text-on-surface focus:outline-hidden focus:border-primary transition-all cursor-pointer"
                            >
                              <option value="">-- Chưa gán khách sạn --</option>
                              {allProperties.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.city})
                                </option>
                              ))}
                            </select>
                          </div>
                          <p className="text-xs text-outline text-pretty">
                            Đối tác chỉ được thao tác trên khách sạn được chỉ định này.
                          </p>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs text-outline flex items-center gap-2.5">
                          <ShieldCheck className="w-4 h-4 text-outline shrink-0" />
                          <span className="text-pretty">
                            Tài khoản khách hàng (Traveler) không gán quyền quản lý cơ sở lưu trú.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Account Status */}
                    <div>
                      <label className="block text-sm font-semibold text-on-surface mb-1.5">
                        Trạng thái tài khoản
                      </label>
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setEditIsActive(true)}
                            className={`py-2 px-3 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                              editIsActive
                                ? 'bg-emerald-500/15 text-emerald-800 border-emerald-500 font-bold shadow-2xs'
                                : 'bg-surface-container-low border-outline-variant/30 text-outline hover:text-on-surface'
                            }`}
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Kích hoạt</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditIsActive(false)}
                            className={`py-2 px-3 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                              !editIsActive
                                ? 'bg-rose-500/15 text-rose-800 border-rose-500 font-bold shadow-2xs'
                                : 'bg-surface-container-low border-outline-variant/30 text-outline hover:text-on-surface'
                            }`}
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Tạm khóa</span>
                          </button>
                        </div>
                        <p className="text-xs text-outline text-pretty">
                          {editIsActive
                            ? 'Tài khoản được phép đăng nhập và sử dụng hệ thống bình thường.'
                            : 'Tài khoản bị tạm khóa, tạm ngừng quyền đăng nhập.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-outline-variant/20 bg-surface-container-low/40 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-outline hover:text-on-surface cursor-pointer transition-colors"
              >
                Đóng
              </button>

              {editingUser.role !== 'ADMIN' && (
                <button
                  type="button"
                  disabled={isEditSubmitting}
                  onClick={handleSaveUserRole}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-semibold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isEditSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Lưu Phân Quyền</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

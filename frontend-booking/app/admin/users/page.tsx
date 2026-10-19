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
  MapPin,
  Lock,
  Unlock,
  AlertCircle,
  Eye,
  Filter,
} from 'lucide-react';
import {
  useUsersQuery,
  useApprovePartnerMutation,
  useUpdateUserRoleMutation,
} from '@/features/users/hooks/use-users';
import { usePropertiesQuery } from '@/features/catalog/hooks/use-catalog';
import { luxuryAlert } from '@/lib/alert/luxury-alert';
import type { UserItem } from '@/features/users/service/users.client';

type TabType = 'all' | 'pending' | 'partners' | 'admins';

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);

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
    }

    return {
      role,
      status,
      search: searchKeyword.trim() || undefined,
      page,
      pageSize: 20,
    };
  }, [activeTab, searchKeyword, statusFilter, page]);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-outline-variant/30">
        <div>
          <span className="text-xs font-extrabold text-primary uppercase tracking-wider whitespace-nowrap">
            Kênh Quản Trị Hệ Thống
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight text-balance mt-0.5">
            Quản Lý Người Dùng & Đối Tác
          </h1>
          <p className="text-xs sm:text-sm text-outline text-pretty">
            Quản lý danh sách tài khoản, phê duyệt đối tác khách sạn và phân quyền truy cập.
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-outline whitespace-nowrap">Tổng người dùng</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-on-surface">
            {summary.total_users}
          </span>
        </div>

        <div
          onClick={() => setActiveTab('pending')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
              : 'bg-surface-container-lowest border-outline-variant/30 hover:border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-700 whitespace-nowrap">Chờ duyệt đối tác</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-900">
              {summary.total_pending}
            </span>
            {summary.total_pending > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-xs font-bold whitespace-nowrap">
                Cần xử lý
              </span>
            )}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('partners')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'partners'
              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
              : 'bg-surface-container-lowest border-outline-variant/30 hover:border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-700 whitespace-nowrap">Đối tác khách sạn</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-900">
            {summary.total_partners}
          </span>
        </div>

        <div
          onClick={() => setActiveTab('admins')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'admins'
              ? 'bg-purple-500/10 border-purple-500/40 shadow-sm'
              : 'bg-surface-container-lowest border-outline-variant/30 hover:border-purple-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-700 whitespace-nowrap">Quản trị viên</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-purple-900">
            {summary.total_admins}
          </span>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant/30">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setActiveTab('all');
              setPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-surface-container-high'
            }`}
          >
            Tất cả người dùng
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('pending');
              setPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-surface-container-high'
            }`}
          >
            <span>Chờ duyệt đối tác</span>
            {summary.total_pending > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-xs font-extrabold ${
                  activeTab === 'pending'
                    ? 'bg-white text-amber-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {summary.total_pending}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('partners');
              setPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'partners'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-surface-container-high'
            }`}
          >
            Đối tác khách sạn
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('admins');
              setPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'admins'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-surface-container-high'
            }`}
          >
            Quản trị viên
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
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
            className="px-3 py-2 bg-surface-container-low rounded-xl border border-outline-variant/30 text-xs font-medium text-on-surface focus:outline-none transition-all cursor-pointer whitespace-nowrap"
          >
            <option value="all">Trạng thái: Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Đã tạm khóa</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs text-outline font-semibold uppercase tracking-wider whitespace-nowrap">
              Đang tải danh sách người dùng...
            </span>
          </div>
        ) : usersList.length === 0 ? (
          <div className="p-12 text-center space-y-2">
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
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-low text-xs font-bold text-outline uppercase tracking-wider">
                  <th className="py-3 px-4">Người dùng</th>
                  <th className="py-3 px-4">Vai trò</th>
                  <th className="py-3 px-4">Khách sạn liên kết</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Ngày tham gia</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-xs">
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
                      className="hover:bg-surface-container-low/50 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-on-surface text-sm">
                          {user.display_name}
                        </div>
                        <div className="text-outline text-xs mt-0.5">
                          @{user.username} • {user.email}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${roleBadgeClass}`}
                        >
                          {user.role === 'ADMIN' && <ShieldCheck className="w-3.5 h-3.5" />}
                          {user.role === 'HOTEL_PARTNER' && <Building2 className="w-3.5 h-3.5" />}
                          {user.pending_approval && <Clock className="w-3.5 h-3.5" />}
                          <span>{roleLabel}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {user.managed_property ? (
                          <div>
                            <div className="font-semibold text-on-surface flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span>{user.managed_property.name}</span>
                            </div>
                            <div className="text-outline text-xs mt-0.5 flex items-center gap-2">
                              <span>{user.managed_property.city}</span>
                              <span
                                className={`inline-block px-1.5 py-0.2 rounded-sm text-xs font-medium whitespace-nowrap ${
                                  user.managed_property.is_active
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {user.managed_property.is_active ? 'Đã kích hoạt' : 'Chờ kích hoạt'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-outline italic">Chưa liên kết</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                            user.is_active
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {user.is_active ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-outline whitespace-nowrap">
                        {new Date(user.created_at).toLocaleDateString('vi-VN')}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
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
                            className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs border border-outline-variant/30 transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                            <span>Phân quyền</span>
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
      </div>

      {/* IN-PLACE MODAL: Phê Duyệt Đối Tác Khách Sạn */}
      {approvingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-on-surface text-balance">
                    Duyệt Hồ Sơ Đối Tác Khách Sạn
                  </h3>
                  <span className="text-xs text-outline">
                    Xác nhận nâng vai trò thành HOTEL_PARTNER
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

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-2">
                <div className="flex justify-between">
                  <span className="text-outline">Người đại diện:</span>
                  <span className="font-bold text-on-surface">{approvingUser.display_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Tài khoản & Email:</span>
                  <span className="font-medium text-slate-700">
                    @{approvingUser.username} • {approvingUser.email}
                  </span>
                </div>
                {Boolean(approvingUser.registration_metadata?.phone) && (
                  <div className="flex justify-between">
                    <span className="text-outline">Điện thoại liên hệ:</span>
                    <span className="font-semibold text-slate-700">
                      {String(approvingUser.registration_metadata?.phone)}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  Cơ sở lưu trú kích hoạt quản lý
                </label>
                <select
                  value={approvalPropertyId}
                  onChange={(e) => setApprovalPropertyId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30 text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
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
                <span className="text-xs text-outline mt-1 block">
                  Khi duyệt, khách sạn sẽ được kích hoạt trạng thái mở bán và đối tác được cấp toàn quyền quản trị.
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setApprovingUser(null)}
                className="px-4 py-2.5 rounded-full text-xs font-bold text-outline hover:text-on-surface cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                disabled={isApprovingSubmitting}
                onClick={handleConfirmApproval}
                className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isApprovingSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang duyệt...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác nhận Duyệt Role Đối Tác</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-PLACE DRAWER: Phân Quyền & Vai Trò Người Dùng */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface-container-lowest h-full shadow-2xl border-l border-outline-variant/30 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-on-surface text-balance">
                      Phân Quyền Người Dùng
                    </h3>
                    <span className="text-xs text-outline">
                      {editingUser.display_name} (@{editingUser.username})
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="p-1 rounded-full text-outline hover:text-on-surface cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5">
                    Vai trò hệ thống (Role)
                  </label>
                  <div className="space-y-2">
                    <label
                      className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                        editRole === 'HOTEL_PARTNER'
                          ? 'border-emerald-600 bg-emerald-500/10'
                          : 'border-outline-variant/30 bg-surface-container-low'
                      }`}
                    >
                      <input
                        type="radio"
                        name="userRole"
                        checked={editRole === 'HOTEL_PARTNER'}
                        onChange={() => setEditRole('HOTEL_PARTNER')}
                        className="mt-0.5 text-emerald-600"
                      />
                      <div>
                        <span className="font-bold text-on-surface block">
                          Đối tác Khách sạn (HOTEL_PARTNER)
                        </span>
                        <span className="text-outline block mt-0.5">
                          Quản lý phòng, lịch allotment, bảng giá và đơn đặt trong phạm vi cơ sở lưu trú được gán.
                        </span>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                        editRole === 'ADMIN'
                          ? 'border-purple-600 bg-purple-500/10'
                          : 'border-outline-variant/30 bg-surface-container-low'
                      }`}
                    >
                      <input
                        type="radio"
                        name="userRole"
                        checked={editRole === 'ADMIN'}
                        onChange={() => setEditRole('ADMIN')}
                        className="mt-0.5 text-purple-600"
                      />
                      <div>
                        <span className="font-bold text-on-surface block">
                          Quản trị viên Sàn (ADMIN)
                        </span>
                        <span className="text-outline block mt-0.5">
                          Toàn quyền quản trị sàn OTA, người dùng, cấu hình và đồng bộ VietSage PMS.
                        </span>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                        editRole === 'TRAVELER'
                          ? 'border-slate-600 bg-slate-500/10'
                          : 'border-outline-variant/30 bg-surface-container-low'
                      }`}
                    >
                      <input
                        type="radio"
                        name="userRole"
                        checked={editRole === 'TRAVELER'}
                        onChange={() => setEditRole('TRAVELER')}
                        className="mt-0.5 text-slate-600"
                      />
                      <div>
                        <span className="font-bold text-on-surface block">
                          Người dùng thông thường (TRAVELER)
                        </span>
                        <span className="text-outline block mt-0.5">
                          Không có quyền truy cập khu vực quản trị hoặc cổng vận hành đối tác.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {editRole === 'HOTEL_PARTNER' && (
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1.5">
                      Khách sạn quản lý (Scope Boundary)
                    </label>
                    <select
                      value={editPropertyId}
                      onChange={(e) => setEditPropertyId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30 text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="">-- Chưa gán khách sạn --</option>
                      {allProperties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.city})
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-outline mt-1 block">
                      Đối tác chỉ được thao tác trên khách sạn được chỉ định này.
                    </span>
                  </div>
                )}

                <div className="pt-2">
                  <label className="block text-xs font-bold text-on-surface mb-1.5">
                    Trạng thái tài khoản
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEditIsActive(true)}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                        editIsActive
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-surface-container-low border-outline-variant/30 text-outline'
                      }`}
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Kích hoạt</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditIsActive(false)}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                        !editIsActive
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-surface-container-low border-outline-variant/30 text-outline'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Tạm khóa</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2.5 rounded-full text-xs font-bold text-outline hover:text-on-surface cursor-pointer transition-colors"
              >
                Đóng
              </button>

              <button
                type="button"
                disabled={isEditSubmitting}
                onClick={handleSaveUserRole}
                className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isEditSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu Thay Đổi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

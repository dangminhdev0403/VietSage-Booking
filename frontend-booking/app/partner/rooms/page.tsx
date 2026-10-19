'use client';

import React, { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  BedDouble,
  Users,
  Maximize2,
  Waves,
  Edit3,
  X,
  Save,
  RefreshCw,
  Star,
  MapPin,
  Check,
  Coffee,
  Info,
  Plus,
  Trash2,
  Power,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  LayoutGrid,
  List,
  CheckCircle2,
  PauseCircle,
  TrendingUp,
  Building2,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { usePropertyDetailQuery, usePropertiesQuery } from '@/features/catalog/hooks/use-catalog';
import {
  createRoomType,
  updateRoomType,
  deleteRoomType,
} from '@/features/catalog/service/catalog.client';
import { luxuryAlert } from '@/lib/alert/luxury-alert';

type RoomTypeItem = {
  id: string;
  name: string;
  description?: string | null;
  max_guests: number;
  base_price: number;
  area_sqm?: number | null;
  bed_type?: string | null;
  bed_count?: number | null;
  has_sea_view?: boolean | null;
  amenities?: string[];
  is_active?: boolean | null;
};

// Formats number to '1.000.000 ₫'
const formatVND = (val: number): string =>
  new Intl.NumberFormat('vi-VN').format(val) + ' ₫';

// Format raw string/number into thousands dot format '1.000.000'
const formatNumberDots = (val: number | string): string => {
  const clean = String(val).replace(/\D/g, '');
  if (!clean) return '';
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Parse '1.000.000' into integer 1000000
const parseNumberDots = (val: string): number => {
  const clean = String(val).replace(/\D/g, '');
  return clean ? parseInt(clean, 10) : 0;
};

export default function PartnerRoomsPage() {
  const { data: session, status: authStatus } = useSession();
  const searchParams = useSearchParams();
  const queryPropId = searchParams.get('propertyId');

  const user = session?.user as
    | {
        role?: string;
        managedPropertyId?: string | null;
        accessibleProperties?: Array<{ id: string; name: string }>;
      }
    | undefined;

  const isAdmin = user?.role === 'ADMIN' || !user?.managedPropertyId;
  const { data: allPropsData } = usePropertiesQuery({}, { enabled: isAdmin && authStatus === 'authenticated' });
  const allProperties = allPropsData?.items || [];

  const [adminSelectedPropId, setAdminSelectedPropId] = useState<string>('');

  const effectivePropertyId = useMemo(() => {
    if (user?.managedPropertyId) return user.managedPropertyId;
    if (adminSelectedPropId) return adminSelectedPropId;
    if (queryPropId && allProperties.some((p) => p.id === queryPropId)) return queryPropId;
    return allProperties[0]?.id || '';
  }, [user?.managedPropertyId, adminSelectedPropId, queryPropId, allProperties]);

  const {
    data: property,
    isLoading,
    refetch,
  } = usePropertyDetailQuery(effectivePropertyId, {
    enabled: authStatus === 'authenticated' && Boolean(effectivePropertyId),
  });

  // Filter & Search & View Mode States
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');
  const [sortBy, setSortBy] = useState<'NAME_ASC' | 'PRICE_ASC' | 'PRICE_DESC'>('NAME_ASC');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Detail Modal State
  const [selectedDetailRoom, setSelectedDetailRoom] = useState<RoomTypeItem | null>(null);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createMaxGuests, setCreateMaxGuests] = useState(2);
  const [createBedType, setCreateBedType] = useState('1 Giường King-size');
  const [createAreaSqm, setCreateAreaSqm] = useState(48);
  const [createBasePriceStr, setCreateBasePriceStr] = useState('1.800.000');
  const [createHasSeaView, setCreateHasSeaView] = useState(false);
  const [createIsActive, setCreateIsActive] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Edit Modal State
  const [editingRoom, setEditingRoom] = useState<RoomTypeItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editMaxGuests, setEditMaxGuests] = useState(2);
  const [editBedType, setEditBedType] = useState('1 Giường King-size');
  const [editAreaSqm, setEditAreaSqm] = useState(52);
  const [editBasePriceStr, setEditBasePriceStr] = useState('2.000.000');
  const [editHasSeaView, setEditHasSeaView] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Status Action Loading
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const openDetailModal = (room: RoomTypeItem) => {
    setSelectedDetailRoom(room);
  };

  const closeDetailModal = () => {
    setSelectedDetailRoom(null);
  };

  const openCreateModal = () => {
    setCreateName('');
    setCreateDescription('');
    setCreateMaxGuests(2);
    setCreateBedType('1 Giường King-size');
    setCreateAreaSqm(48);
    setCreateBasePriceStr('1.800.000');
    setCreateHasSeaView(false);
    setCreateIsActive(true);
    setIsCreateOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
  };

  const openEditModal = (room: RoomTypeItem) => {
    setEditingRoom(room);
    setEditName(room.name);
    setEditDescription(room.description || '');
    setEditMaxGuests(room.max_guests || 2);
    setEditBedType(
      room.bed_type ||
        (room.name.toLowerCase().includes('suite') ? '1 King hoặc 2 Twin' : '1 Giường King-size'),
    );
    setEditAreaSqm(
      room.area_sqm ||
        (room.name.toLowerCase().includes('villa')
          ? 120
          : room.name.toLowerCase().includes('suite')
          ? 75
          : 52),
    );
    setEditBasePriceStr(formatNumberDots(room.base_price || 2000000));
    setEditHasSeaView(
      Boolean(
        room.has_sea_view ||
          room.name.toLowerCase().includes('sea') ||
          room.name.toLowerCase().includes('ocean'),
      ),
    );
    setEditIsActive(room.is_active !== false);
  };

  const closeEditModal = () => {
    setEditingRoom(null);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseNumberDots(createBasePriceStr);
    if (!createName.trim()) {
      luxuryAlert.error({
        title: 'Thiếu Tên Hạng Phòng',
        message: 'Vui lòng nhập tên hạng phòng để đăng bán.',
      });
      return;
    }
    if (price < 1000) {
      luxuryAlert.error({
        title: 'Giá Bán Không Hợp Lệ',
        message: 'Giá phòng cơ sở tối thiểu là 1.000 VND.',
      });
      return;
    }

    setIsCreating(true);
    try {
      await createRoomType({
        property_id: effectivePropertyId,
        name: createName.trim(),
        description: createDescription.trim() || undefined,
        max_guests: Number(createMaxGuests) || 2,
        base_price: price,
        area_sqm: Number(createAreaSqm) || undefined,
        bed_type: createBedType.trim() || undefined,
        has_sea_view: createHasSeaView,
        is_active: createIsActive,
      });

      await luxuryAlert.success({
        title: 'Đăng Bán Thành Công',
        message: `Đã đăng bán hạng phòng "${createName.trim()}" thành công trên sàn OTA.`,
        confirmText: 'Hoàn Tất',
      });
      closeCreateModal();
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tạo hạng phòng mới lúc này';
      luxuryAlert.error({
        title: 'Đăng Bán Phòng Thất Bại',
        message: msg,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;

    const price = parseNumberDots(editBasePriceStr);
    if (!editName.trim()) {
      luxuryAlert.error({
        title: 'Thiếu Tên Hạng Phòng',
        message: 'Vui lòng nhập tên hạng phòng.',
      });
      return;
    }
    if (price < 1000) {
      luxuryAlert.error({
        title: 'Giá Bán Không Hợp Lệ',
        message: 'Giá phòng cơ sở tối thiểu là 1.000 VND.',
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateRoomType(editingRoom.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        max_guests: Number(editMaxGuests) || 2,
        base_price: price,
        area_sqm: Number(editAreaSqm) || undefined,
        bed_type: editBedType.trim() || undefined,
        has_sea_view: editHasSeaView,
        is_active: editIsActive,
      });

      await luxuryAlert.success({
        title: 'Cập Nhật Thành Công',
        message: `Đã cập nhật thông số hạng phòng "${editName.trim()}" thành công.`,
        confirmText: 'Đã Hiểu',
      });
      closeEditModal();
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể lưu thay đổi hạng phòng';
      luxuryAlert.error({
        title: 'Cập Nhật Thất Bại',
        message: msg,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (room: RoomTypeItem) => {
    const nextStatus = room.is_active === false;
    setActionLoadingId(room.id);
    try {
      await updateRoomType(room.id, {
        is_active: nextStatus,
      });
      await luxuryAlert.success({
        title: nextStatus ? 'Đã Kích Hoạt Mở Bán' : 'Đã Tạm Dừng Đăng Bán',
        message: nextStatus
          ? `Đã kích hoạt mở bán lại hạng phòng "${room.name}". Hạng phòng hiện đã sẵn sàng hiển thị cho khách đặt.`
          : `Đã tạm dừng đăng bán hạng phòng "${room.name}". Hạng phòng tạm thời ngưng nhận đặt mới trên sàn OTA.`,
        confirmText: 'Đã Hiểu',
      });
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể đổi trạng thái đăng bán';
      luxuryAlert.error({
        title: 'Thao Tác Thất Bại',
        message: msg,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteRoom = async (room: RoomTypeItem) => {
    const isConfirmed = await luxuryAlert.confirm({
      title: 'Xác Nhận Xóa Hạng Phòng',
      message: `Quý đối tác có chắc chắn muốn xóa hạng phòng "${room.name}"? Nếu phòng đã có lịch sử đặt trước, hệ thống sẽ tự động chuyển sang trạng thái ngưng bán an toàn.`,
      confirmText: 'Xác Nhận Xóa',
      cancelText: 'Giữ Lại',
      isDangerous: true,
    });

    if (!isConfirmed) return;

    setActionLoadingId(room.id);
    try {
      await deleteRoomType(room.id);
      await luxuryAlert.success({
        title: 'Xóa Hạng Phòng Thành Công',
        message: `Đã xóa hạng phòng "${room.name}" thành công khỏi hệ thống.`,
        confirmText: 'Đã Hiểu',
      });
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa hạng phòng lúc này';
      luxuryAlert.error({
        title: 'Xóa Thất Bại',
        message: msg,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const rawRoomTypes: RoomTypeItem[] = (property?.room_types as RoomTypeItem[]) || [];

  // Summary Metrics
  const activeRoomsCount = useMemo(
    () => rawRoomTypes.filter((r) => r.is_active !== false).length,
    [rawRoomTypes],
  );
  const pausedRoomsCount = useMemo(
    () => rawRoomTypes.filter((r) => r.is_active === false).length,
    [rawRoomTypes],
  );
  const averagePrice = useMemo(() => {
    if (rawRoomTypes.length === 0) return 0;
    const total = rawRoomTypes.reduce((sum, r) => sum + (r.base_price || 0), 0);
    return Math.round(total / rawRoomTypes.length);
  }, [rawRoomTypes]);

  // Filtered & Sorted Rooms
  const filteredRooms = useMemo(() => {
    let result = [...rawRoomTypes];

    // Search query
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(kw) ||
          (r.description && r.description.toLowerCase().includes(kw)) ||
          (r.bed_type && r.bed_type.toLowerCase().includes(kw)),
      );
    }

    // Status filter
    if (statusFilter === 'ACTIVE') {
      result = result.filter((r) => r.is_active !== false);
    } else if (statusFilter === 'PAUSED') {
      result = result.filter((r) => r.is_active === false);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'NAME_ASC') {
        return a.name.localeCompare(b.name, 'vi');
      }
      if (sortBy === 'PRICE_ASC') {
        return (a.base_price || 0) - (b.base_price || 0);
      }
      if (sortBy === 'PRICE_DESC') {
        return (b.base_price || 0) - (a.base_price || 0);
      }
      return 0;
    });

    return result;
  }, [rawRoomTypes, searchKeyword, statusFilter, sortBy]);

  // Pagination calculation
  const totalItems = filteredRooms.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRooms = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * itemsPerPage;
    return filteredRooms.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredRooms, safeCurrentPage, itemsPerPage]);

  const startRecordNumber = totalItems > 0 ? (safeCurrentPage - 1) * itemsPerPage + 1 : 0;
  const endRecordNumber = Math.min(safeCurrentPage * itemsPerPage, totalItems);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 text-emerald-800 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
            <BedDouble className="w-4 h-4 text-emerald-700" />
            <span>Kênh Quản Trị OTA &amp; Đối Tác • Quản Lý Phòng</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 text-balance">
            Quản Lý Phòng
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1 text-pretty">
            Cấu hình các hạng phòng, giá bán niêm yết, tiện ích và trạng thái mở bán trên kênh OTA.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {isAdmin && allProperties.length > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <select
                value={effectivePropertyId}
                onChange={(e) => setAdminSelectedPropId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[220px] truncate"
              >
                {allProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:bg-slate-50 transition-all flex items-center gap-2 text-sm font-bold cursor-pointer disabled:opacity-50 whitespace-nowrap"
            title="Tải lại danh sách phòng"
          >
            <RefreshCw className={`w-4 h-4 text-slate-700 ${isLoading ? 'animate-spin text-emerald-700' : ''}`} />
            <span>Làm mới</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm Phòng Mới</span>
          </button>
        </div>
      </div>

      {/* 2. PROPERTY PROFILE OVERVIEW CARD */}
      {property && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
              {property.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={property.thumbnail_url}
                  alt={property.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <BedDouble className="w-7 h-7 text-slate-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 text-balance">{property.name}</h2>
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md text-xs font-bold text-amber-800 whitespace-nowrap">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{property.star_rating} Sao</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 mt-1 text-pretty">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{property.address}, {property.city}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 whitespace-nowrap">
              <Check className="w-3.5 h-3.5 text-emerald-700" />
              <span>Quyền quản lý trực tiếp cơ sở</span>
            </span>
          </div>
        </div>
      )}

      {/* 3. METRICS OVERVIEW STRIP */}
      {rawRoomTypes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Tổng Hạng Phòng</span>
              <BedDouble className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{rawRoomTypes.length}</span>
              <span className="text-xs text-slate-500 font-medium">hạng lưu trú</span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <span>Đang Mở Bán</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-800">{activeRoomsCount}</span>
              <span className="text-xs text-emerald-700 font-medium">sẵn sàng đón khách</span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-amber-800 text-xs font-bold uppercase tracking-wider">
              <span>Tạm Dừng Bán</span>
              <PauseCircle className="w-4 h-4 text-amber-700" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-800">{pausedRoomsCount}</span>
              <span className="text-xs text-amber-700 font-medium">ngưng nhận đơn</span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Giá Bình Quân Cơ Sở</span>
              <TrendingUp className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-emerald-800">{formatVND(averagePrice)}</span>
              <span className="text-xs text-slate-400 font-normal">/ đêm</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. ROOM INVENTORY SECTION */}
      <div className="space-y-4">
        {/* Toolbar: Search, Filter, Sort, View Toggle */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tên hạng phòng, giường, tiện ích..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-700 focus:bg-white transition-all"
            />
            {searchKeyword && (
              <button
                type="button"
                onClick={() => {
                  setSearchKeyword('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter & View Mode Cluster */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'PAUSED');
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden focus:border-emerald-700 cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang mở bán ({activeRoomsCount})</option>
                <option value="PAUSED">Tạm dừng bán ({pausedRoomsCount})</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'NAME_ASC' | 'PRICE_ASC' | 'PRICE_DESC')}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden focus:border-emerald-700 cursor-pointer"
            >
              <option value="NAME_ASC">Sắp xếp: Tên A-Z</option>
              <option value="PRICE_ASC">Giá: Thấp đến Cao</option>
              <option value="PRICE_DESC">Giá: Cao đến Thấp</option>
            </select>

            {/* View Mode Switcher (Table vs Grid) */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  viewMode === 'table'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Xem dạng bảng biểu danh sách (Table List)"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Bảng biểu</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  viewMode === 'grid'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Xem dạng thẻ (Cards)"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Dạng thẻ</span>
              </button>
            </div>
          </div>
        </div>

        {/* 5. MAIN CONTENT DISPLAY: TABLE LIST OR CARD GRID */}
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-sm bg-white rounded-3xl border border-slate-200/80">
            <div className="w-8 h-8 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Đang tải dữ liệu quỹ phòng của cơ sở...
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm bg-white rounded-3xl border border-slate-200/80 space-y-3">
            <BedDouble className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-800 text-base">
              {rawRoomTypes.length === 0
                ? 'Cơ sở lưu trú chưa có phòng nào được đăng bán.'
                : 'Không tìm thấy hạng phòng nào khớp với tiêu chí tìm kiếm hoặc bộ lọc.'}
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto text-pretty">
              {rawRoomTypes.length === 0
                ? 'Bắt đầu đăng bán hạng phòng đầu tiên để đón nhận khách đặt phòng từ sàn OTA ngay hôm nay.'
                : 'Hãy thử xóa từ khóa tìm kiếm hoặc đặt lại bộ lọc trạng thái để xem đầy đủ danh sách.'}
            </p>
            {rawRoomTypes.length === 0 ? (
              <button
                onClick={openCreateModal}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Đăng Bán Hạng Phòng Mới</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setSearchKeyword('');
                  setStatusFilter('ALL');
                }}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Đặt lại bộ lọc</span>
              </button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          /* TABLE LIST VIEW (Streamlined, Clear Row Data, Row-Click to Detail Modal) */
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-700 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center" scope="col">#</th>
                    <th className="py-3.5 px-4 min-w-[220px]" scope="col">Hạng Phòng</th>
                    <th className="py-3.5 px-4 min-w-[210px]" scope="col">Thông Số &amp; Diện Tích</th>
                    <th className="py-3.5 px-4 w-36 whitespace-nowrap" scope="col">Giá Cơ Sở / Đêm</th>
                    <th className="py-3.5 px-4 w-36 text-center whitespace-nowrap" scope="col">Trạng Thái</th>
                    <th className="py-3.5 pl-4 pr-6 w-28 text-right whitespace-nowrap" scope="col">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedRooms.map((room, idx) => {
                    const bedType =
                      room.bed_type ||
                      (room.name.toLowerCase().includes('suite') ? '1 King hoặc 2 Twin' : '1 Giường King-size');
                    const area =
                      room.area_sqm ||
                      (room.name.toLowerCase().includes('villa')
                        ? 120
                        : room.name.toLowerCase().includes('suite')
                        ? 75
                        : 52);
                    const hasSeaView = Boolean(
                      room.has_sea_view ||
                        room.name.toLowerCase().includes('sea') ||
                        room.name.toLowerCase().includes('ocean'),
                    );
                    const isRoomActive = room.is_active !== false;
                    const rowNumber = startRecordNumber + idx;

                    return (
                      <tr
                        key={room.id}
                        onClick={() => openDetailModal(room)}
                        className={`group cursor-pointer transition-colors hover:bg-emerald-50/40 ${
                          !isRoomActive ? 'bg-amber-50/20' : ''
                        }`}
                        title="Click để xem đầy đủ chi tiết hạng phòng"
                      >
                        {/* Index Number */}
                        <td className="py-3.5 px-4 text-center text-xs font-bold text-slate-400">
                          {rowNumber}
                        </td>

                        {/* Room Name & View Tag (Stacked, never cramped into 1 word per line) */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="font-bold text-slate-900 group-hover:text-emerald-800 text-sm sm:text-base leading-snug transition-colors text-balance">
                              {room.name}
                            </div>
                            <div>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border whitespace-nowrap ${
                                  hasSeaView
                                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}
                              >
                                {hasSeaView ? 'View Biển' : 'View Vườn'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Capacity, Bedding & Area Combined (Clean, Compact, 2 neat lines) */}
                        <td className="py-3.5 px-4 text-slate-700">
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 whitespace-nowrap">
                              <Users className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span>Tối đa {room.max_guests || 2} khách</span>
                              <span className="text-slate-300">•</span>
                              <BedDouble className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="text-slate-600 truncate max-w-[140px]" title={bedType}>
                                {bedType}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500 whitespace-nowrap">
                              <Maximize2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span>{area} m²</span>
                              <span className="text-slate-300">•</span>
                              <Waves className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{hasSeaView ? 'Hướng Biển' : 'Hướng Vườn'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Base Price */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-sm sm:text-base font-black text-emerald-800 tracking-tight">
                            {formatVND(room.base_price)}
                          </div>
                          <div className="text-xs text-slate-400 font-medium">/ đêm</div>
                        </td>

                        {/* Sales Status Badge (Directly Toggleable with Loading State) */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(room);
                            }}
                            disabled={actionLoadingId === room.id}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer hover:shadow-2xs active:scale-95 disabled:opacity-50 whitespace-nowrap ${
                              isRoomActive
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                            }`}
                            title={isRoomActive ? 'Click để tạm dừng mở bán' : 'Click để kích hoạt mở bán lại'}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isRoomActive ? 'bg-emerald-600' : 'bg-amber-600'
                              }`}
                            />
                            <span>{isRoomActive ? 'Đang mở bán' : 'Tạm dừng bán'}</span>
                          </button>
                        </td>

                        {/* Actions (Only Edit & Delete, perfectly padded, zero overflow) */}
                        <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                          <div
                            className="inline-flex items-center gap-2 justify-end"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => openEditModal(room)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 transition-colors shadow-2xs cursor-pointer"
                              title="Chỉnh sửa thông số hạng phòng"
                              aria-label="Chỉnh sửa hạng phòng"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteRoom(room)}
                              disabled={actionLoadingId === room.id}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                              title="Xóa hạng phòng"
                              aria-label="Xóa hạng phòng"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* FULL PAGINATION FOOTER */}
            <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-600">
              <div className="flex items-center gap-4">
                <span>
                  Hiển thị <strong className="text-slate-900 font-bold">{startRecordNumber} - {endRecordNumber}</strong> trên tổng số{' '}
                  <strong className="text-slate-900 font-bold">{totalItems}</strong> hạng phòng
                </span>

                <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200">
                  <span>Số dòng mỗi trang:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="py-1 px-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-hidden focus:border-emerald-700 cursor-pointer"
                  >
                    <option value={5}>5 dòng</option>
                    <option value={10}>10 dòng</option>
                    <option value={20}>20 dòng</option>
                    <option value={50}>50 dòng</option>
                  </select>
                </div>
              </div>

              {/* Page Navigation Controls */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-bold mr-2 whitespace-nowrap">
                  Trang {safeCurrentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first, last, and pages close to current
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - safeCurrentPage) <= 1
                    );
                  })
                  .map((page, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && page - prev > 1;

                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            safeCurrentPage === page
                              ? 'bg-emerald-700 text-white shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Trang kế tiếp"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* GRID CARD VIEW (Alternative Mode) */
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {paginatedRooms.map((room) => {
                const bedType =
                  room.bed_type ||
                  (room.name.toLowerCase().includes('suite') ? '1 King hoặc 2 Twin' : '1 Giường King-size');
                const area =
                  room.area_sqm ||
                  (room.name.toLowerCase().includes('villa')
                    ? 120
                    : room.name.toLowerCase().includes('suite')
                    ? 75
                    : 52);
                const hasSeaView = Boolean(
                  room.has_sea_view ||
                    room.name.toLowerCase().includes('sea') ||
                    room.name.toLowerCase().includes('ocean'),
                );
                const isRoomActive = room.is_active !== false;

                return (
                  <div
                    key={room.id}
                    onClick={() => openDetailModal(room)}
                    className={`bg-white rounded-3xl p-6 border transition-all flex flex-col justify-between space-y-5 cursor-pointer hover:shadow-xs ${
                      isRoomActive
                        ? 'border-slate-200/80 shadow-2xs'
                        : 'border-amber-200/70 bg-amber-50/20 opacity-90'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Header: Name and Status Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap ${
                                isRoomActive
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isRoomActive ? 'bg-emerald-600' : 'bg-amber-600'
                                }`}
                              />
                              <span>{isRoomActive ? 'Đang mở bán' : 'Tạm dừng bán'}</span>
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug text-balance">
                            {room.name}
                          </h3>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs text-slate-500 font-medium">Giá bán niêm yết</div>
                          <div className="text-lg sm:text-xl font-black text-emerald-800 tracking-tight whitespace-nowrap">
                            {formatVND(room.base_price)}
                            <span className="text-xs font-normal text-slate-400"> / đêm</span>
                          </div>
                        </div>
                      </div>

                      {/* Core Specifications Pill Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2">
                          <Users className="w-4 h-4 text-emerald-700 shrink-0" />
                          <div>
                            <div className="text-xs text-slate-500 font-medium">Sức chứa</div>
                            <div className="text-xs font-bold text-slate-800 whitespace-nowrap">
                              Tối đa {room.max_guests || 2} khách
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2">
                          <BedDouble className="w-4 h-4 text-emerald-700 shrink-0" />
                          <div>
                            <div className="text-xs text-slate-500 font-medium">Loại giường</div>
                            <div className="text-xs font-bold text-slate-800 truncate" title={bedType}>
                              {bedType}
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2">
                          <Maximize2 className="w-4 h-4 text-emerald-700 shrink-0" />
                          <div>
                            <div className="text-xs text-slate-500 font-medium">Diện tích</div>
                            <div className="text-xs font-bold text-slate-800 whitespace-nowrap">
                              {area} m²
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2">
                          <Waves className="w-4 h-4 text-emerald-700 shrink-0" />
                          <div>
                            <div className="text-xs text-slate-500 font-medium">Hướng phòng</div>
                            <div className="text-xs font-bold text-slate-800 whitespace-nowrap">
                              {hasSeaView ? 'Hướng Biển' : 'Hướng Vườn'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div
                      className="flex flex-wrap items-center justify-between gap-2.5 pt-4 border-t border-slate-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(room)}
                        disabled={actionLoadingId === room.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors border cursor-pointer disabled:opacity-50 whitespace-nowrap ${
                          isRoomActive
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}
                        title={isRoomActive ? 'Tạm dừng đăng bán phòng' : 'Mở bán lại phòng'}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{isRoomActive ? 'Tạm Dừng' : 'Mở Bán'}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(room)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRoom(room)}
                          disabled={actionLoadingId === room.id}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                          title="Xóa hạng phòng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination for Grid View */}
            <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-600">
              <div>
                Hiển thị <strong className="text-slate-900 font-bold">{startRecordNumber} - {endRecordNumber}</strong> trên tổng số{' '}
                <strong className="text-slate-900 font-bold">{totalItems}</strong> hạng phòng
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-bold mr-2 whitespace-nowrap">
                  Trang {safeCurrentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      safeCurrentPage === page
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. ROOM DETAIL MODAL (Opens upon clicking any row) */}
      {selectedDetailRoom && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeDetailModal}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Đóng chi tiết"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-emerald-800 text-xs font-extrabold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>Kênh Quản Trị Đối Tác • Chi Tiết Hạng Phòng</span>
            </div>

            <div className="pr-8">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 text-balance">
                {selectedDetailRoom.name}
              </h3>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap ${
                    selectedDetailRoom.is_active !== false
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      selectedDetailRoom.is_active !== false ? 'bg-emerald-600' : 'bg-amber-600'
                    }`}
                  />
                  <span>{selectedDetailRoom.is_active !== false ? 'Đang mở bán trên sàn' : 'Tạm dừng bán'}</span>
                </span>

                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border whitespace-nowrap ${
                    selectedDetailRoom.has_sea_view
                      ? 'bg-sky-50 text-sky-800 border-sky-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {selectedDetailRoom.has_sea_view ? 'View Hướng Biển' : 'View Hướng Vườn'}
                </span>
              </div>
            </div>

            {/* Price Highlight Banner */}
            <div className="mt-4 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Giá Bán Niêm Yết Cơ Sở
                </div>
                <div className="text-xs text-emerald-700 mt-0.5 font-medium">
                  Áp dụng niêm yết trên kênh OTA
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl sm:text-2xl font-black text-emerald-800 tracking-tight whitespace-nowrap">
                  {formatVND(selectedDetailRoom.base_price)}
                </div>
                <span className="text-xs text-emerald-700 font-medium">/ đêm lưu trú</span>
              </div>
            </div>

            {/* Specifications 4-Grid */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Users className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Sức Chứa Tối Đa</span>
                </div>
                <div className="text-sm font-bold text-slate-900 mt-1 whitespace-nowrap">
                  Tối đa {selectedDetailRoom.max_guests || 2} khách
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Diện Tích Phòng</span>
                </div>
                <div className="text-sm font-bold text-slate-900 mt-1 whitespace-nowrap">
                  {selectedDetailRoom.area_sqm || 52} m²
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <BedDouble className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Cấu Hình Giường</span>
                </div>
                <div className="text-sm font-bold text-slate-900 mt-1 truncate" title={selectedDetailRoom.bed_type || '1 Giường King-size'}>
                  {selectedDetailRoom.bed_type || '1 Giường King-size'}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Waves className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Tầm Nhìn Hướng Phòng</span>
                </div>
                <div className="text-sm font-bold text-slate-900 mt-1 whitespace-nowrap">
                  {selectedDetailRoom.has_sea_view ? 'Hướng Biển' : 'Hướng Vườn'}
                </div>
              </div>
            </div>

            {/* Description Details */}
            <div className="mt-4 space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Mô Tả Không Gian &amp; Tiện Nghi
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-600 leading-relaxed text-pretty">
                {selectedDetailRoom.description
                  ? selectedDetailRoom.description
                  : 'Chưa có thông tin mô tả chi tiết cho hạng phòng này.'}
              </div>
            </div>

            {/* Included Privileges */}
            <div className="mt-4 space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Đặc Quyền Dịch Vụ Đi Kèm
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 font-medium">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                  <Coffee className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Buffet sáng mỗi ngày</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Wifi tốc độ cao toàn khu</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Dọn phòng hàng ngày</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Nước khoáng &amp; trà chào đón</span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-5 mt-5 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleToggleStatus(selectedDetailRoom);
                    closeDetailModal();
                  }}
                  disabled={actionLoadingId === selectedDetailRoom.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors border cursor-pointer disabled:opacity-50 whitespace-nowrap ${
                    selectedDetailRoom.is_active !== false
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{selectedDetailRoom.is_active !== false ? 'Tạm Dừng Mở Bán' : 'Mở Bán Lại'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeDetailModal}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Đóng
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const r = selectedDetailRoom;
                    closeDetailModal();
                    openEditModal(r);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Chỉnh Sửa</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. CREATE ROOM MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeCreateModal}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 text-emerald-800 text-xs font-extrabold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>Đăng Bán Hạng Phòng Mới</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 text-balance">
              Thiết Lập Thông Số Hạng Phòng
            </h3>

            <div className="mt-3 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-xs text-emerald-950 flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span className="text-pretty">
                Hạng phòng sau khi đăng bán sẽ hiển thị trực tiếp cho khách hàng lựa chọn và đặt phòng tức thì trên sàn.
              </span>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4 mt-5">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Tên Hạng Phòng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Ví dụ: Deluxe Suite Hướng Biển, Premier Garden Villa..."
                  required
                  className="w-full px-3.5 py-3 text-sm rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-hidden focus:border-emerald-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Giá Cơ Sở / Đêm (VND) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={createBasePriceStr}
                    onChange={(e) => setCreateBasePriceStr(formatNumberDots(e.target.value))}
                    placeholder="1.500.000"
                    required
                    className="w-full pl-3.5 pr-14 py-3 text-base font-bold text-emerald-800 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:border-emerald-700"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                    VND / đêm
                  </span>
                </div>
                <p className="text-xs text-slate-500 pt-0.5">
                  Giá hiển thị: <strong className="text-emerald-800">{formatVND(parseNumberDots(createBasePriceStr))}</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Số Khách Tối Đa
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={createMaxGuests}
                    onChange={(e) => setCreateMaxGuests(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-hidden focus:border-emerald-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Diện Tích (m²)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={createAreaSqm}
                    onChange={(e) => setCreateAreaSqm(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-hidden focus:border-emerald-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Cấu Hình Giường
                </label>
                <input
                  type="text"
                  value={createBedType}
                  onChange={(e) => setCreateBedType(e.target.value)}
                  placeholder="Ví dụ: 1 Giường King-size hoặc 2 Giường Đơn Twin"
                  required
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-hidden focus:border-emerald-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Mô Tả Tiện Nghi &amp; Điểm Nổi Bật
                </label>
                <textarea
                  rows={2}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Mô tả ban công riêng, bồn tắm nằm, quang cảnh nhìn ra biển..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-hidden focus:border-emerald-700"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={createHasSeaView}
                    onChange={(e) => setCreateHasSeaView(e.target.checked)}
                    className="w-4 h-4 text-emerald-700 accent-emerald-700 rounded-sm cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Hướng nhìn biển (Sea View)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={createIsActive}
                    onChange={(e) => setCreateIsActive(e.target.checked)}
                    className="w-4 h-4 text-emerald-700 accent-emerald-700 rounded-sm cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Kích hoạt mở bán ngay lập tức
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isCreating ? 'Đang tạo...' : 'Đăng Bán Phòng'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. EDIT ROOM MODAL */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeEditModal}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 text-emerald-800 text-xs font-extrabold uppercase tracking-wider mb-1">
              <Edit3 className="w-4 h-4 text-emerald-700" />
              <span>Chỉnh Sửa Hạng Phòng</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 text-balance">
              {editingRoom.name}
            </h3>

            <div className="mt-3 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-xs text-emerald-950 flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span className="text-pretty">
                Thông số cập nhật áp dụng cho hiển thị bán phòng trên kênh OTA. Việc phân bổ buồng phòng vật lý do hệ thống VietSage PMS điều hành.
              </span>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-4 mt-5">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Tên Hạng Phòng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3.5 py-3 text-sm rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-hidden focus:border-emerald-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Giá Cơ Sở / Đêm (VND) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editBasePriceStr}
                    onChange={(e) => setEditBasePriceStr(formatNumberDots(e.target.value))}
                    required
                    className="w-full pl-3.5 pr-14 py-3 text-base font-bold text-emerald-800 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:border-emerald-700"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                    VND / đêm
                  </span>
                </div>
                <p className="text-xs text-slate-500 pt-0.5">
                  Giá hiển thị: <strong className="text-emerald-800">{formatVND(parseNumberDots(editBasePriceStr))}</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Số Khách Tối Đa
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={editMaxGuests}
                    onChange={(e) => setEditMaxGuests(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-hidden focus:border-emerald-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Diện Tích (m²)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={editAreaSqm}
                    onChange={(e) => setEditAreaSqm(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-hidden focus:border-emerald-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Cấu Hình Giường
                </label>
                <input
                  type="text"
                  value={editBedType}
                  onChange={(e) => setEditBedType(e.target.value)}
                  placeholder="Ví dụ: 1 Giường King-size hoặc 2 Twin"
                  required
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-hidden focus:border-emerald-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Mô Tả Tiện Nghi
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-hidden focus:border-emerald-700"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editHasSeaView}
                    onChange={(e) => setEditHasSeaView(e.target.checked)}
                    className="w-4 h-4 text-emerald-700 accent-emerald-700 rounded-sm cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Hướng nhìn biển (Sea View)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="w-4 h-4 text-emerald-700 accent-emerald-700 rounded-sm cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Kích hoạt mở bán trên sàn
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-2xs disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

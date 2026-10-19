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
  previewVietSageRooms,
  importVietSageRooms,
  type VietSageCatalogPreview,
  type VietSagePreviewRoomType,
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
  vietsage_room_type_id?: string | null;
  room_images?: string[];
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
        email?: string | null;
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
  const [createVietSageRoomTypeId, setCreateVietSageRoomTypeId] = useState('');
  const [createRoomImages, setCreateRoomImages] = useState<string[]>([]);
  const [newCreateImageUrl, setNewCreateImageUrl] = useState('');
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
  const [editVietSageRoomTypeId, setEditVietSageRoomTypeId] = useState('');
  const [editRoomImages, setEditRoomImages] = useState<string[]>([]);
  const [newEditImageUrl, setNewEditImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Status Action Loading
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // VietSage PMS 1-Click Import Modal States
  const [showVietSageModal, setShowVietSageModal] = useState(false);
  const [isLoadingVietSagePreview, setIsLoadingVietSagePreview] = useState(false);
  const [isImportingVietSage, setIsImportingVietSage] = useState(false);
  const [vietSagePreviewData, setVietSagePreviewData] = useState<VietSageCatalogPreview | null>(null);
  const [selectedRoomKeys, setSelectedRoomKeys] = useState<string[]>([]);
  const [vietSageError, setVietSageError] = useState<string | null>(null);

  const loadVietSagePreview = async (propId: string) => {
    setIsLoadingVietSagePreview(true);
    setVietSageError(null);
    try {
      const data = await previewVietSageRooms(propId);
      setVietSagePreviewData(data);
      // Default: select all room types
      setSelectedRoomKeys(data.room_types.map((rt) => rt.normalized_key));
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Không thể kết nối và tải danh mục phòng từ VietSage PMS';
      setVietSageError(msg);
    } finally {
      setIsLoadingVietSagePreview(false);
    }
  };

  const openVietSageSyncModal = () => {
    if (!effectivePropertyId) {
      luxuryAlert.error({
        title: 'Chưa Chọn Cơ Sở Lưu Trú',
        message: 'Vui lòng chọn cơ sở lưu trú trước khi thực hiện nhập phòng.',
      });
      return;
    }
    setShowVietSageModal(true);
    loadVietSagePreview(effectivePropertyId);
  };

  const closeVietSageSyncModal = () => {
    if (isImportingVietSage) return;
    setShowVietSageModal(false);
    setVietSageError(null);
  };

  const toggleSelectRoomKey = (key: string) => {
    setSelectedRoomKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const toggleSelectAllRooms = (selectAll: boolean) => {
    if (!vietSagePreviewData) return;
    if (selectAll) {
      setSelectedRoomKeys(
        vietSagePreviewData.room_types.map((rt) => rt.normalized_key),
      );
    } else {
      setSelectedRoomKeys([]);
    }
  };

  const handleExecuteImport = async () => {
    if (!effectivePropertyId) return;
    if (selectedRoomKeys.length === 0) {
      luxuryAlert.error({
        title: 'Chưa Chọn Hạng Phòng',
        message: 'Vui lòng chọn ít nhất 1 hạng phòng để tiến hành nhập.',
      });
      return;
    }

    setIsImportingVietSage(true);
    try {
      const result = await importVietSageRooms(
        effectivePropertyId,
        selectedRoomKeys,
      );
      await luxuryAlert.success({
        title: 'Nhập Phòng Thành Công',
        message: `Đã nhập và đồng bộ thành công ${result.total_processed} hạng phòng (tạo mới: ${result.created_count}, cập nhật: ${result.updated_count}) cùng quỹ phòng 30 ngày từ VietSage PMS.`,
        confirmText: 'Tuyệt Vời',
      });
      setShowVietSageModal(false);
      refetch();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Không thể nhập danh mục phòng từ VietSage PMS';
      luxuryAlert.error({
        title: 'Nhập Phòng Thất Bại',
        message: msg,
      });
    } finally {
      setIsImportingVietSage(false);
    }
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
    setCreateVietSageRoomTypeId('');
    setCreateRoomImages([]);
    setNewCreateImageUrl('');
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
    setEditVietSageRoomTypeId(room.vietsage_room_type_id || '');
    setEditRoomImages(room.room_images || []);
    setNewEditImageUrl('');
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
        vietsage_room_type_id: createVietSageRoomTypeId.trim() || undefined,
        room_images: createRoomImages,
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
        vietsage_room_type_id: editVietSageRoomTypeId.trim() ? editVietSageRoomTypeId.trim() : null,
        room_images: editRoomImages,
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
            type="button"
            onClick={openVietSageSyncModal}
            className="px-4 py-2.5 rounded-2xl bg-[#24473d] hover:bg-[#1b362e] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98 whitespace-nowrap"
            title="Đồng bộ tự động danh mục loại phòng và quỹ phòng từ VietSage PMS"
          >
            <Sparkles className="w-4 h-4 text-[#e8b363]" />
            <span>Nhập phòng từ VietSage PMS</span>
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
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={openVietSageSyncModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#24473d] hover:bg-[#1b362e] text-white font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap active:scale-98"
                >
                  <Sparkles className="w-4 h-4 text-[#e8b363]" />
                  <span>Nhập phòng từ VietSage PMS</span>
                </button>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm phòng thủ công</span>
                </button>
              </div>
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
                        onClick={() => openEditModal(room)}
                        className={`group cursor-pointer transition-colors hover:bg-emerald-50/40 ${
                          !isRoomActive ? 'bg-amber-50/20' : ''
                        }`}
                        title="Click để chỉnh sửa hạng phòng"
                      >
                        {/* Index Number */}
                        <td className="py-3.5 px-4 text-center text-xs font-bold text-slate-400">
                          {rowNumber}
                        </td>

                        {/* Room Name & Thumbnail */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100 flex items-center justify-center">
                              {room.room_images && room.room_images.length > 0 ? (
                                <img
                                  src={room.room_images[0]}
                                  alt={room.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <BedDouble className="w-5 h-5 text-slate-400" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 group-hover:text-emerald-800 text-sm sm:text-base leading-snug transition-colors text-balance">
                                {room.name}
                              </div>
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
                    onClick={() => openEditModal(room)}
                    className={`bg-white rounded-3xl p-6 border transition-all flex flex-col justify-between space-y-5 cursor-pointer hover:shadow-xs ${
                      isRoomActive
                        ? 'border-slate-200/80 shadow-2xs'
                        : 'border-amber-200/70 bg-amber-50/20 opacity-90'
                    }`}
                    title="Click để chỉnh sửa hạng phòng"
                  >
                    <div className="space-y-3">
                      {/* Room Photo / Fallback Banner */}
                      {room.room_images && room.room_images.length > 0 ? (
                        <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                          <img
                            src={room.room_images[0]}
                            alt={room.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-xs font-semibold backdrop-blur-xs whitespace-nowrap">
                            {room.room_images.length} ảnh
                          </span>
                        </div>
                      ) : (
                        <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center p-3 text-center">
                          <div className="flex items-center gap-2 text-slate-500 text-xs">
                            <BedDouble className="w-4 h-4 text-emerald-700" />
                            <span className="font-semibold text-slate-700">Chưa tải ảnh lên</span>
                          </div>
                        </div>
                      )}

                      {/* Header: Name and Status Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
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

      {/* CREATE ROOM MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl max-w-5xl xl:max-w-6xl w-full shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:px-8 sm:py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60">
              <div className="space-y-1 pr-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 text-balance">
                      Đăng Bán Hạng Phòng Mới
                    </h3>
                    <p className="text-sm text-slate-500 text-pretty">
                      Thiết lập thông số kỹ thuật, bảng giá và mở bán phòng trực tiếp trên kênh OTA.
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer self-start shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - 4 Structured Sections */}
            <form onSubmit={handleCreateRoom} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-5 sm:p-7 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-start">
                  {/* Left Column: Sections 1 & 2 */}
                  <div className="space-y-5">
                    {/* Section 1: Thông tin định danh & Giá bán */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4.5 sm:p-5 shadow-xs space-y-4">
                      <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 text-balance">
                            1. Thông Tin Định Danh &amp; Giá Bán
                          </h4>
                          <p className="text-xs text-slate-500 text-pretty">
                            Tên nhận diện thương mại và đơn giá niêm yết cơ sở
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3.5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                            Tên Hạng Phòng <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={createName}
                            onChange={(e) => setCreateName(e.target.value)}
                            placeholder="Ví dụ: Deluxe Ocean King, Family Suite..."
                            required
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-hidden focus:border-emerald-700"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
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
                              className="w-full pl-3.5 pr-20 py-2.5 text-base font-bold text-emerald-800 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:border-emerald-700"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 whitespace-nowrap">
                              VND / đêm
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 pt-0.5">
                            Giá hiển thị: <strong className="text-emerald-800">{formatVND(parseNumberDots(createBasePriceStr))}</strong>
                          </p>
                        </div>

                        <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 cursor-pointer select-none hover:bg-slate-50 transition-colors">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-800 block">Trạng Thái Mở Bán</span>
                            <span className="text-xs text-slate-500 block text-pretty">Kích hoạt mở bán ngay khi tạo hạng phòng</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={createIsActive}
                              onChange={(e) => setCreateIsActive(e.target.checked)}
                              className="w-4 h-4 text-emerald-700 accent-emerald-700 rounded-sm cursor-pointer"
                            />
                            <span className={`text-xs font-semibold whitespace-nowrap px-2 py-0.5 rounded-md ${createIsActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                              {createIsActive ? 'Đang Mở Bán' : 'Tạm Dừng'}
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Section 2: Không gian & Tiêu chuẩn lưu trú */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4.5 sm:p-5 shadow-xs space-y-4">
                      <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                          <BedDouble className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 text-balance">
                            2. Không Gian &amp; Tiêu Chuẩn Lưu Trú
                          </h4>
                          <p className="text-xs text-slate-500 text-pretty">
                            Thông số diện tích, sức chứa và cấu hình tiện ích phòng
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3.5">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
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

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
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

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                            Cấu Hình Giường
                          </label>
                          <input
                            type="text"
                            value={createBedType}
                            onChange={(e) => setCreateBedType(e.target.value)}
                            placeholder="Ví dụ: 1 Giường Đôi King, 2 Giường Đơn..."
                            required
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-hidden focus:border-emerald-700"
                          />
                        </div>

                        <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 cursor-pointer select-none hover:bg-slate-50 transition-colors">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-800 block">Tầm Nhìn Hướng Biển (Sea View)</span>
                            <span className="text-xs text-slate-500 block text-pretty">Gắn nhãn nhận diện ưu tiên trên bộ lọc phòng tìm kiếm</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={createHasSeaView}
                            onChange={(e) => setCreateHasSeaView(e.target.checked)}
                            className="w-4 h-4 text-emerald-700 accent-emerald-700 rounded-sm cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Sections 3 & 4 */}
                  <div className="space-y-5">
                    {/* Section 3: Bộ sưu tập hình ảnh không gian */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4.5 sm:p-5 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 text-balance">
                              3. Bộ Sưu Tập Hình Ảnh Không Gian
                            </h4>
                            <p className="text-xs text-slate-500 text-pretty">
                              Hình ảnh chất lượng cao đại diện cho hạng phòng
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                          {createRoomImages.length} ảnh
                        </span>
                      </div>

                      <div className="space-y-3">
                        {createRoomImages.length > 0 ? (
                          <div className="grid grid-cols-3 gap-2.5 max-h-40 overflow-y-auto p-1">
                            {createRoomImages.map((imgUrl, idx) => (
                              <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-2xs">
                                <img src={imgUrl} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setCreateRoomImages((prev) => prev.filter((_, i) => i !== idx))}
                                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                                  title="Xóa ảnh này"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500 space-y-1">
                            <BedDouble className="w-5 h-5 text-slate-400 mx-auto" />
                            <p className="text-pretty">Chưa có hình ảnh. Thêm URL hình ảnh bên dưới để tăng tỷ lệ chuyển đổi phòng.</p>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="url"
                            value={newCreateImageUrl}
                            onChange={(e) => setNewCreateImageUrl(e.target.value)}
                            placeholder="https://domain.com/photo.jpg"
                            className="flex-1 px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-hidden focus:border-emerald-700"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!newCreateImageUrl.trim()) return;
                              if (!newCreateImageUrl.startsWith('http://') && !newCreateImageUrl.startsWith('https://')) {
                                luxuryAlert.error({
                                  title: 'Đường Dẫn Không Hợp Lệ',
                                  message: 'Vui lòng nhập đường dẫn ảnh hợp lệ (bắt đầu bằng http:// hoặc https://).',
                                });
                                return;
                              }
                              setCreateRoomImages((prev) => [...prev, newCreateImageUrl.trim()]);
                              setNewCreateImageUrl('');
                            }}
                            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                          >
                            + Thêm Ảnh
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Đồng bộ VietSage PMS & Mô tả tiện nghi */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4.5 sm:p-5 shadow-xs space-y-4">
                      <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                          <RefreshCw className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 text-balance">
                            4. Đồng Bộ VietSage PMS &amp; Mô Tả Tiện Nghi
                          </h4>
                          <p className="text-xs text-slate-500 text-pretty">
                            Ánh xạ định danh hệ thống PMS nội bộ và nội dung tiện ích
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3.5">
                        <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-1.5">
                          <label className="text-xs font-bold text-emerald-950 flex items-center justify-between uppercase tracking-wider">
                            <span>Mã / Ký Hiệu Hạng Phòng VietSage PMS</span>
                            <span className="text-xs text-emerald-700 font-normal lowercase tracking-normal">Tùy chọn</span>
                          </label>
                          <input
                            type="text"
                            value={createVietSageRoomTypeId}
                            onChange={(e) => setCreateVietSageRoomTypeId(e.target.value)}
                            placeholder="Nhập mã hoặc tên loại phòng PMS"
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-slate-200 font-medium text-slate-900 focus:outline-hidden focus:border-emerald-700"
                          />
                          <p className="text-xs text-slate-600 pt-0.5 text-pretty">
                            Nhập tên hoặc ký hiệu loại phòng trên VietSage PMS để hệ thống tự động ánh xạ tồn kho và phân phòng an toàn.
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                            Mô Tả Tiện Nghi &amp; Điểm Nổi Bật
                          </label>
                          <textarea
                            rows={3}
                            value={createDescription}
                            onChange={(e) => setCreateDescription(e.target.value)}
                            placeholder="Mô tả tiện nghi nổi bật, diện tích, ban công và đặc quyền đi kèm..."
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-hidden focus:border-emerald-700 resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="p-4 sm:px-8 sm:py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
                <span className="text-xs text-slate-500 hidden sm:inline-block">
                  Kiểm tra kỹ giá cơ sở và thông số trước khi mở bán.
                </span>
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-white transition-colors cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isCreating ? 'Đang tạo...' : 'Đăng Bán Phòng'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. EDIT ROOM MODAL */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl max-w-5xl xl:max-w-6xl w-full shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:px-8 sm:py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60">
              <div className="space-y-1 pr-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 text-balance">
                      Chỉnh Sửa Hạng Phòng: {editingRoom.name}
                    </h3>
                    <p className="text-sm text-slate-500 text-pretty">
                      Cập nhật thông số hiển thị và giá bán trên sàn OTA. Việc phân bổ buồng phòng vật lý do hệ thống VietSage PMS điều hành.
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer self-start shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - 4 Structured Sections */}
            <form onSubmit={handleSaveRoom} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-5 sm:p-7 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-start">
                  {/* Left Column: Sections 1 & 2 */}
                  <div className="space-y-5">
                    {/* Section 1: Thông tin định danh & Giá bán */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4.5 sm:p-5 shadow-xs space-y-4">
                      <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 text-balance">
                            1. Thông Tin Định Danh &amp; Giá Bán
                          </h4>
                          <p className="text-xs text-slate-500 text-pretty">
                            Tên nhận diện thương mại và đơn giá niêm yết cơ sở
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3.5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                            Tên Hạng Phòng <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Nhập tên hạng phòng"
                            required
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-hidden focus:border-emerald-700"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                            Giá Cơ Sở / Đêm (VND) <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={editBasePriceStr}
                              onChange={(e) => setEditBasePriceStr(formatNumberDots(e.target.value))}
                              required
                              className="w-full pl-3.5 pr-20 py-2.5 text-base font-bold text-emerald-800 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:border-emerald-700"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 whitespace-nowrap">
                              VND / đêm
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 pt-0.5">
                            Giá hiển thị: <strong className="text-emerald-800">{formatVND(parseNumberDots(editBasePriceStr))}</strong>
                          </p>
                        </div>

                        <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 cursor-pointer select-none hover:bg-slate-50 transition-colors">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-800 block">Trạng Thái Mở Bán</span>
                            <span className="text-xs text-slate-500 block text-pretty">Cho phép khách đặt phòng trực tiếp trên sàn OTA</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editIsActive}
                              onChange={(e) => setEditIsActive(e.target.checked)}
                              className="w-4 h-4 text-emerald-700 accent-emerald-700 rounded-sm cursor-pointer"
                            />
                            <span className={`text-xs font-semibold whitespace-nowrap px-2 py-0.5 rounded-md ${editIsActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                              {editIsActive ? 'Đang Mở Bán' : 'Tạm Dừng'}
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Section 2: Không gian & Tiêu chuẩn lưu trú */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4.5 sm:p-5 shadow-xs space-y-4">
                      <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                          <BedDouble className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 text-balance">
                            2. Không Gian &amp; Tiêu Chuẩn Lưu Trú
                          </h4>
                          <p className="text-xs text-slate-500 text-pretty">
                            Thông số diện tích, sức chứa và cấu hình tiện ích phòng
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3.5">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
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

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
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

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                            Cấu Hình Giường
                          </label>
                          <input
                            type="text"
                            value={editBedType}
                            onChange={(e) => setEditBedType(e.target.value)}
                            placeholder="Ví dụ: King, Queen, 2 Single Beds..."
                            required
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-hidden focus:border-emerald-700"
                          />
                        </div>

                        <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 cursor-pointer select-none hover:bg-slate-50 transition-colors">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-800 block">Tầm Nhìn Hướng Biển (Sea View)</span>
                            <span className="text-xs text-slate-500 block text-pretty">Gắn nhãn nhận diện ưu tiên trên bộ lọc phòng tìm kiếm</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={editHasSeaView}
                            onChange={(e) => setEditHasSeaView(e.target.checked)}
                            className="w-4 h-4 text-emerald-700 accent-emerald-700 rounded-sm cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Sections 3 & 4 */}
                  <div className="space-y-5">
                    {/* Section 3: Bộ sưu tập hình ảnh không gian */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4.5 sm:p-5 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 text-balance">
                              3. Bộ Sưu Tập Hình Ảnh Không Gian
                            </h4>
                            <p className="text-xs text-slate-500 text-pretty">
                              Hình ảnh chất lượng cao đại diện cho hạng phòng
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                          {editRoomImages.length} ảnh
                        </span>
                      </div>

                      <div className="space-y-3">
                        {editRoomImages.length > 0 ? (
                          <div className="grid grid-cols-3 gap-2.5 max-h-40 overflow-y-auto p-1">
                            {editRoomImages.map((imgUrl, idx) => (
                              <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-2xs">
                                <img src={imgUrl} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setEditRoomImages((prev) => prev.filter((_, i) => i !== idx))}
                                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                                  title="Xóa ảnh này"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500 space-y-1">
                            <BedDouble className="w-5 h-5 text-slate-400 mx-auto" />
                            <p className="text-pretty">Hạng phòng chưa có ảnh (vừa đồng bộ từ PMS). Dán đường dẫn ảnh bên dưới để bổ sung.</p>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="url"
                            value={newEditImageUrl}
                            onChange={(e) => setNewEditImageUrl(e.target.value)}
                            placeholder="https://domain.com/photo.jpg"
                            className="flex-1 px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-hidden focus:border-emerald-700"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!newEditImageUrl.trim()) return;
                              if (!newEditImageUrl.startsWith('http://') && !newEditImageUrl.startsWith('https://')) {
                                luxuryAlert.error({
                                  title: 'Đường Dẫn Không Hợp Lệ',
                                  message: 'Vui lòng nhập đường dẫn ảnh hợp lệ (bắt đầu bằng http:// hoặc https://).',
                                });
                                return;
                              }
                              setEditRoomImages((prev) => [...prev, newEditImageUrl.trim()]);
                              setNewEditImageUrl('');
                            }}
                            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                          >
                            + Thêm Ảnh
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Đồng bộ VietSage PMS & Mô tả tiện nghi */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4.5 sm:p-5 shadow-xs space-y-4">
                      <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                          <RefreshCw className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 text-balance">
                            4. Đồng Bộ VietSage PMS &amp; Mô Tả Tiện Nghi
                          </h4>
                          <p className="text-xs text-slate-500 text-pretty">
                            Ánh xạ định danh hệ thống PMS nội bộ và nội dung tiện ích
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3.5">
                        <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                              Mã / Ký Hiệu VietSage PMS
                            </label>
                            {editVietSageRoomTypeId && (
                              <button
                                type="button"
                                onClick={() => setEditVietSageRoomTypeId('')}
                                className="text-xs text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                              >
                                Cắt Liên Kết
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={editVietSageRoomTypeId}
                            onChange={(e) => setEditVietSageRoomTypeId(e.target.value)}
                            placeholder="Nhập mã hoặc tên loại phòng PMS"
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-slate-200 font-medium text-slate-900 focus:outline-hidden focus:border-emerald-700"
                          />
                          <p className="text-xs text-slate-600 pt-0.5 text-pretty">
                            {editVietSageRoomTypeId
                              ? 'Hạng phòng này đang liên kết bảo mật với VietSage PMS. Đơn đặt phòng sẽ tự động gửi hold và phân phòng.'
                              : 'Chưa liên kết PMS. Nhập tên/ký hiệu hạng phòng VietSage để kích hoạt đồng bộ tự động.'}
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                            Mô Tả Tiện Nghi &amp; Điểm Nổi Bật
                          </label>
                          <textarea
                            rows={3}
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Mô tả tiện nghi nổi bật, diện tích, ban công và đặc quyền đi kèm..."
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-hidden focus:border-emerald-700 resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="p-4 sm:px-8 sm:py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
                <span className="text-xs text-slate-500 hidden sm:inline-block">
                  Thay đổi sẽ được đồng bộ tức thì lên sàn OTA.
                </span>
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-white transition-colors cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors flex items-center gap-2 shadow-2xs disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. VIETSAGE PMS 1-CLICK BATCH IMPORT MODAL */}
      {showVietSageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-5xl xl:max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-[#fbf8f2]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#24473d] text-[#e8b363] flex items-center justify-center shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#17201b] text-balance">
                    Nhập Hạng Phòng Từ VietSage PMS
                  </h3>
                  <p className="text-sm text-[#69726b] text-pretty">
                    Trích xuất danh mục phòng, giá cơ sở và kích hoạt quỹ phòng 30 ngày trực tiếp từ PMS sang kênh Booking OTA.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeVietSageSyncModal}
                disabled={isImportingVietSage}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {isLoadingVietSagePreview ? (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-[#24473d] animate-spin" />
                  <p className="text-base font-bold text-slate-800">
                    Đang kết nối VietSage PMS...
                  </p>
                  <p className="text-sm text-slate-500">
                    Xác thực chữ ký số HMAC SHA-256 và tải danh mục phòng thực tế.
                  </p>
                </div>
              ) : vietSageError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-rose-900">
                        Không thể tải danh mục phòng
                      </h4>
                      <p className="text-xs text-rose-700 text-pretty">
                        {vietSageError}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        effectivePropertyId &&
                        loadVietSagePreview(effectivePropertyId)
                      }
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Thử lại kết nối
                    </button>
                  </div>
                </div>
              ) : vietSagePreviewData ? (
                <div className="space-y-4">
                  {/* Hotel Identity Card */}
                  <div className="rounded-2xl border border-[#e8dfd1] bg-[#fcfaf7] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#24473d] text-white flex items-center justify-center font-bold text-xs">
                        PMS
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-[#17201b]">
                            {vietSagePreviewData.hotel_name}
                          </h4>
                          <span className="rounded bg-slate-200/80 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700 whitespace-nowrap">
                            {vietSagePreviewData.hotel_code}
                          </span>
                        </div>
                        <p className="text-sm text-[#69726b]">
                          Email đối tác: <strong className="text-slate-800">{vietSagePreviewData.partner_email || user?.email || 'Đã liên kết'}</strong>
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 whitespace-nowrap self-start sm:self-auto">
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{vietSagePreviewData.total_pms_rooms} phòng thực tế trong PMS</span>
                    </span>
                  </div>

                  {/* Room Selection Toolbar */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={
                          vietSagePreviewData.room_types.length > 0 &&
                          selectedRoomKeys.length ===
                            vietSagePreviewData.room_types.length
                        }
                        onChange={(e) => toggleSelectAllRooms(e.target.checked)}
                        className="w-4 h-4 text-[#24473d] accent-[#24473d] rounded cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-slate-800">
                        Chọn tất cả ({vietSagePreviewData.room_types.length} hạng phòng)
                      </span>
                    </label>

                    <span className="text-xs font-bold text-[#24473d] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 whitespace-nowrap">
                      Đã chọn {selectedRoomKeys.length} / {vietSagePreviewData.room_types.length}
                    </span>
                  </div>

                  {/* Room Types List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {vietSagePreviewData.room_types.map((rt) => {
                      const isSelected = selectedRoomKeys.includes(
                        rt.normalized_key,
                      );
                      return (
                        <div
                          key={rt.normalized_key}
                          onClick={() => toggleSelectRoomKey(rt.normalized_key)}
                          className={`rounded-2xl border p-4 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#24473d] bg-[#fbf8f2] shadow-2xs'
                              : 'border-slate-200 bg-white hover:border-slate-300 opacity-70'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}} // handled by parent onClick
                                className="w-4 h-4 text-[#24473d] accent-[#24473d] rounded mt-1 cursor-pointer shrink-0"
                              />
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h5 className="text-base font-bold text-slate-900">
                                    {rt.name}
                                  </h5>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 whitespace-nowrap">
                                    {rt.bed_type}
                                  </span>
                                  {rt.action === 'CREATE' ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                                      + Tạo mới &amp; Quỹ phòng 30 ngày
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                                      Đồng bộ cập nhật
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                                  <span className="inline-flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Tối đa {rt.max_guests} khách</span>
                                  </span>
                                  <span>•</span>
                                  <span className="inline-flex items-center gap-1">
                                    <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{rt.area_sqm} m²</span>
                                  </span>
                                  <span>•</span>
                                  <span className="inline-flex items-center gap-1">
                                    <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{rt.total_rooms} phòng thực tế</span>
                                  </span>
                                </div>

                                {rt.sample_room_numbers &&
                                  rt.sample_room_numbers.length > 0 && (
                                    <p className="text-xs text-slate-500">
                                      Phòng trong PMS: {rt.sample_room_numbers.map((n) => `P.${n}`).join(', ')}
                                    </p>
                                  )}
                              </div>
                            </div>

                            <div className="text-left sm:text-right shrink-0">
                              <span className="text-base sm:text-lg font-bold text-emerald-800 block">
                                {formatVND(rt.base_price)}
                              </span>
                              <span className="text-xs text-slate-500">
                                giá cơ sở / đêm
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
              <span className="text-xs text-slate-500 hidden sm:inline-block">
                Hệ thống tự động kích hoạt tồn kho 30 ngày cho các phòng được chọn.
              </span>
              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={closeVietSageSyncModal}
                  disabled={isImportingVietSage}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isImportingVietSage || selectedRoomKeys.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-[#24473d] hover:bg-[#1b362e] text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  {isImportingVietSage ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang nhập dữ liệu...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#e8b363]" />
                      <span>
                        Xác Nhận Nhập ({selectedRoomKeys.length} Hạng Phòng)
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

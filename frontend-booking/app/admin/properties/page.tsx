'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import {
  Building2,
  Search,
  MapPin,
  Star,
  ExternalLink,
  BedDouble,
  Users,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Hotel,
  Plus,
  X,
  Save,
  Link2,
  Edit,
  CheckCircle2,
  AlertCircle,
  LayoutList,
  LayoutGrid,
} from 'lucide-react';
import {
  usePropertiesQuery,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
} from '@/features/catalog/hooks/use-catalog';
import { luxuryAlert } from '@/lib/alert/luxury-alert';

export default function AdminPropertiesPage() {
  const { data: session } = useSession();
  const user = session?.user as
    | {
        managedPropertyId?: string | null;
        accessibleProperties?: Array<{ id: string; name: string }>;
      }
    | undefined;
  const managedPropertyId = user?.managedPropertyId;
  const managedPropertyName = managedPropertyId
    ? user?.accessibleProperties?.find((p) => p.id === managedPropertyId)?.name || 'Cơ sở lưu trú liên kết'
    : null;

  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [expandedPropertyIds, setExpandedPropertyIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedPropertyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Create Property Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPropName, setNewPropName] = useState('');
  const [newPropCity, setNewPropCity] = useState('Phú Quốc');
  const [newPropAddress, setNewPropAddress] = useState('');
  const [newPropDescription, setNewPropDescription] = useState('');
  const [newPropStarRating, setNewPropStarRating] = useState(5.0);
  const [newPropThumbnail, setNewPropThumbnail] = useState('');
  const [newPropVietSageHotelId, setNewPropVietSageHotelId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit & Link PMS Modal State
  const [editingProperty, setEditingProperty] = useState<any | null>(null);
  const [editPropName, setEditPropName] = useState('');
  const [editPropCity, setEditPropCity] = useState('Phú Quốc');
  const [editPropAddress, setEditPropAddress] = useState('');
  const [editPropDescription, setEditPropDescription] = useState('');
  const [editPropStarRating, setEditPropStarRating] = useState(5.0);
  const [editPropThumbnail, setEditPropThumbnail] = useState('');
  const [editPropVietSageHotelId, setEditPropVietSageHotelId] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const createPropertyMutation = useCreatePropertyMutation();
  const updatePropertyMutation = useUpdatePropertyMutation();

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName.trim() || !newPropAddress.trim()) return;
    setIsSubmitting(true);
    try {
      await createPropertyMutation.mutateAsync({
        name: newPropName.trim(),
        city: newPropCity.trim(),
        address: newPropAddress.trim(),
        description: newPropDescription.trim() || undefined,
        star_rating: Number(newPropStarRating),
        thumbnail_url: newPropThumbnail.trim() || undefined,
        vietsage_hotel_id: newPropVietSageHotelId.trim() || undefined,
      });
      await luxuryAlert.success({
        title: 'Đăng Khách Sạn Thành Công',
        message: 'Khách sạn mới đã được khởi tạo và cấu hình liên kết PMS thành công!',
        confirmText: 'Hoàn Tất',
      });
      setIsCreateModalOpen(false);
      setNewPropName('');
      setNewPropAddress('');
      setNewPropDescription('');
      setNewPropThumbnail('');
      setNewPropVietSageHotelId('');
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể đăng khách sạn';
      luxuryAlert.error({
        title: 'Đăng Khách Sạn Thất Bại',
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (prop: any) => {
    setEditingProperty(prop);
    setEditPropName(prop.name || '');
    setEditPropCity(prop.city || 'Phú Quốc');
    setEditPropAddress(prop.address || '');
    setEditPropDescription(prop.description || '');
    setEditPropStarRating(prop.star_rating || 5.0);
    setEditPropThumbnail(prop.thumbnail_url || '');
    setEditPropVietSageHotelId(prop.vietsage_hotel_id || '');
  };

  const handleSaveEditProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty || !editPropName.trim() || !editPropAddress.trim()) return;
    setIsEditSubmitting(true);
    try {
      await updatePropertyMutation.mutateAsync({
        id: editingProperty.id,
        payload: {
          name: editPropName.trim(),
          city: editPropCity.trim(),
          address: editPropAddress.trim(),
          description: editPropDescription.trim() || undefined,
          star_rating: Number(editPropStarRating),
          thumbnail_url: editPropThumbnail.trim() || undefined,
          vietsage_hotel_id: editPropVietSageHotelId.trim() ? editPropVietSageHotelId.trim() : null,
        },
      });
      await luxuryAlert.success({
        title: 'Cập Nhật Thành Công',
        message: 'Thông tin khách sạn và mã kết nối VietSage PMS đã được cập nhật!',
        confirmText: 'Hoàn Tất',
      });
      setEditingProperty(null);
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể cập nhật khách sạn';
      luxuryAlert.error({
        title: 'Cập Nhật Thất Bại',
        message,
      });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const { data: propertiesData, isLoading, error, refetch } = usePropertiesQuery();
  const properties = useMemo(() => propertiesData?.items || [], [propertiesData?.items]);

  // Extract unique cities
  const cities = useMemo(() => {
    const set = new Set<string>();
    properties.forEach((p) => {
      if (p.city) set.add(p.city);
    });
    return Array.from(set);
  }, [properties]);

  // Filtered properties
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const matchCity = selectedCity === 'ALL' || p.city.toLowerCase() === selectedCity.toLowerCase();
      const matchKeyword =
        !searchKeyword ||
        p.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        p.address.toLowerCase().includes(searchKeyword.toLowerCase());
      return matchCity && matchKeyword;
    });
  }, [properties, selectedCity, searchKeyword]);

  // Aggregate stats
  const totalRoomTypes = useMemo(() => {
    return properties.reduce((acc, p) => acc + (p.room_types?.length || 0), 0);
  }, [properties]);

  const minPrice = useMemo(() => {
    let min = Infinity;
    properties.forEach((p) => {
      p.room_types?.forEach((rt) => {
        if (rt.base_price < min) min = rt.base_price;
      });
    });
    return min === Infinity ? 0 : min;
  }, [properties]);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
      {/* 1. TOP BREADCRUMB & HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-outline text-xs font-bold uppercase tracking-widest">
            <span>{managedPropertyId ? 'Kênh Đối Tác' : 'Kênh Quản Trị OTA'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-outline-variant" />
            <span className={managedPropertyId ? 'text-emerald-700 font-extrabold' : 'text-primary font-extrabold'}>
              Quản Lý Khách Sạn
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface tracking-tight text-balance">
            {managedPropertyId ? (managedPropertyName || 'Quản Lý Khách Sạn') : 'Quản Lý Khách Sạn'}
          </h1>
        </div>

        {/* Action Cluster */}
        <div className="flex items-center flex-wrap gap-2.5">
          {!managedPropertyId && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl transition-all shadow-xs text-xs font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm Khách Sạn Mới</span>
            </button>
          )}

          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/30 hover:bg-surface-container text-on-surface rounded-2xl transition-all shadow-2xs text-xs font-bold cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-primary" />
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {managedPropertyId && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-3">
          <Hotel className="w-5 h-5 text-emerald-700 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-emerald-950">Phạm vi cơ sở của đối tác: </span>
            <span className="text-emerald-900">
              Bạn đang quản lý trực tiếp cơ sở <strong>{managedPropertyName}</strong> ({managedPropertyId}). Mọi thay đổi về phân hạng phòng dưới đây sẽ đồng bộ lập tức sang kênh đặt phòng OTA của khách hàng.
            </span>
          </div>
        </div>
      )}

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-2xs">
          <div className="flex items-center justify-between text-outline text-xs uppercase font-bold tracking-wider mb-2">
            <span>Tổng Số Khách Sạn</span>
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-on-surface">
            {managedPropertyId ? (managedPropertyName || '1 Khách sạn') : properties.length}
          </div>
          <div className="text-xs text-tertiary font-medium mt-1">
            Đang mở bán trên kênh OTA
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-2xs">
          <div className="flex items-center justify-between text-outline text-xs uppercase font-bold tracking-wider mb-2">
            <span>Tổng Số Hạng Phòng</span>
            <BedDouble className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-on-surface">{totalRoomTypes}</div>
          <div className="text-xs text-outline font-medium mt-1">Hạng phòng khả dụng</div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-2xs">
          <div className="flex items-center justify-between text-outline text-xs uppercase font-bold tracking-wider mb-2">
            <span>Thành Phố / Điểm Đến</span>
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-on-surface">
            {managedPropertyId ? '5 Sao Luxury' : (cities.length || 1)}
          </div>
          <div className="text-xs text-outline font-medium mt-1">
            {managedPropertyId ? 'Chứng nhận cao cấp' : 'Thành phố trọng điểm'}
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-2xs">
          <div className="flex items-center justify-between text-outline text-xs uppercase font-bold tracking-wider mb-2">
            <span>Giá Khởi Điểm Từ</span>
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-on-surface">
            {minPrice > 0
              ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(minPrice)
              : '—'}
          </div>
          <div className="text-xs text-primary font-medium mt-1">
            {managedPropertyId ? 'Giá phòng thấp nhất của cơ sở' : 'Giá tốt nhất trên hệ thống'}
          </div>
        </div>
      </div>

      {/* 3. FILTER & SEARCH BAR */}
      <div className="bg-surface-container-lowest rounded-3xl p-4 sm:p-5 border border-outline-variant/30 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* City Filter Pills (Only for Platform Admin) */}
        {!managedPropertyId ? (
          <div className="flex items-center flex-wrap gap-2 text-xs font-bold">
            <button
              onClick={() => setSelectedCity('ALL')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                selectedCity === 'ALL'
                  ? 'bg-primary text-on-primary shadow-xs font-extrabold'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
            >
              Tất Cả Địa Điểm ({properties.length})
            </button>
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  selectedCity === city
                    ? 'bg-primary text-on-primary shadow-xs font-extrabold'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold text-outline">
            <Building2 className="w-4 h-4 text-primary" />
            <span>Phân hạng phòng và tiện ích chi tiết của cơ sở</span>
          </div>
        )}

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Keyword Search */}
          <div className="relative flex items-center w-full md:w-72 bg-surface-container rounded-2xl px-3.5 py-2.5 border border-outline-variant/30 focus-within:border-primary/50 transition-colors">
            <Search className="w-4 h-4 text-outline mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Tìm theo tên khách sạn, địa chỉ..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="bg-transparent text-xs text-on-surface placeholder:text-outline focus:outline-hidden w-full font-medium"
            />
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-surface-container p-1 rounded-2xl border border-outline-variant/30 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'table'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-outline hover:text-on-surface'
              }`}
              title="Chế độ bảng danh sách"
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline">Bảng</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'cards'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-outline hover:text-on-surface'
              }`}
              title="Chế độ thẻ chi tiết"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Thẻ</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. PROPERTY CATALOG LIST */}
      {isLoading ? (
        <div className="py-24 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant/30">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-outline font-medium">Đang tải danh mục cơ sở lưu trú...</p>
        </div>
      ) : error ? (
        <div className="p-16 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant/30 space-y-4">
          <div className="text-base font-semibold text-rose-600 max-w-md mx-auto leading-relaxed">
            Không thể tải danh sách khách sạn. Vui lòng kiểm tra lại kết nối.
          </div>
          <button
            onClick={() => refetch()}
            className="inline-block px-6 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs whitespace-nowrap"
          >
            Tải Lại Danh Mục
          </button>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="py-20 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant/30 text-outline text-xs">
          Không tìm thấy cơ sở lưu trú nào phù hợp với bộ lọc.
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead className="bg-surface-container/70 text-on-surface-variant uppercase tracking-wider text-xs font-extrabold border-b border-outline-variant/30">
                <tr>
                  <th className="py-3.5 px-4 min-w-[280px]">Khách Sạn / Cơ Sở</th>
                  <th className="py-3.5 px-4 w-[130px] whitespace-nowrap">Thành Phố</th>
                  <th className="py-3.5 px-4 w-[230px] whitespace-nowrap">Liên Kết VietSage PMS</th>
                  <th className="py-3.5 px-4 w-[140px] text-center whitespace-nowrap">Hạng Phòng</th>
                  <th className="py-3.5 px-4 w-[160px] text-right whitespace-nowrap">Giá Khởi Điểm</th>
                  <th className="py-3.5 px-4 w-[190px] text-right whitespace-nowrap">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-on-surface">
                {filteredProperties.map((prop) => {
                  const isExpanded = expandedPropertyIds.has(prop.id);
                  const propRoomTypes = prop.room_types || [];
                  const propMinPrice =
                    propRoomTypes.length > 0
                      ? Math.min(...propRoomTypes.map((rt) => rt.base_price))
                      : null;

                  return (
                    <React.Fragment key={prop.id}>
                      <tr className="hover:bg-surface-container-low/50 transition-colors group">
                        {/* 1. Property Name, Thumbnail, Star & Address */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3.5">
                            <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-outline-variant/30 bg-surface-container">
                              {prop.thumbnail_url ? (
                                <Image
                                  src={prop.thumbnail_url}
                                  alt={prop.name}
                                  fill
                                  className="object-cover"
                                  sizes="56px"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-outline">
                                  <Building2 className="w-6 h-6 opacity-40" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-on-surface text-balance">
                                  {prop.name}
                                </span>
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 text-xs font-bold whitespace-nowrap">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  <span>{prop.star_rating}</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-outline mt-0.5">
                                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span className="truncate max-w-[280px]" title={prop.address}>
                                  {prop.address}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. City Pill */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-surface-container font-semibold text-xs text-on-surface whitespace-nowrap">
                            {prop.city}
                          </span>
                        </td>

                        {/* 3. VietSage PMS Status */}
                        <td className="py-3.5 px-4">
                          {prop.vietsage_hotel_id ? (
                            <div className="inline-flex flex-col gap-1 max-w-[220px]">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-semibold whitespace-nowrap w-fit">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                <span>Đã liên kết PMS</span>
                              </span>
                              <span
                                className="text-xs text-emerald-900 font-mono truncate px-1"
                                title={prop.vietsage_hotel_email || prop.vietsage_hotel_id}
                              >
                                {prop.vietsage_hotel_email ||
                                  (prop.vietsage_hotel_id?.includes('@')
                                    ? prop.vietsage_hotel_id
                                    : prop.partner_email || 'Đã liên kết bảo mật')}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-semibold whitespace-nowrap">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Chưa liên kết</span>
                            </span>
                          )}
                        </td>

                        {/* 4. Room Types Counter & Expand Toggle */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => toggleExpand(prop.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-colors cursor-pointer border border-outline-variant/30 whitespace-nowrap"
                            title={isExpanded ? 'Thu gọn danh sách phòng' : 'Xem chi tiết các hạng phòng'}
                          >
                            <BedDouble className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{propRoomTypes.length} phòng</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-outline" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-outline" />
                            )}
                          </button>
                        </td>

                        {/* 5. Minimum Base Price */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {propMinPrice ? (
                            <div className="flex flex-col items-end">
                              <span className="font-mono text-sm font-black text-primary">
                                {new Intl.NumberFormat('vi-VN', {
                                  style: 'currency',
                                  currency: 'VND',
                                }).format(propMinPrice)}
                              </span>
                              <span className="text-xs text-outline font-medium">/đêm</span>
                            </div>
                          ) : (
                            <span className="text-xs text-outline italic">Chưa có giá</span>
                          )}
                        </td>

                        {/* 6. Action Buttons */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(prop)}
                              className="px-2.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                              title="Liên kết VietSage PMS & Chỉnh sửa thông tin"
                            >
                              <Link2 className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Sửa / PMS</span>
                            </button>
                            <Link
                              href={`/properties/${prop.id}`}
                              target="_blank"
                              className="px-2.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold inline-flex items-center gap-1 transition-colors border border-outline-variant/30 whitespace-nowrap"
                              title="Xem giao diện đặt phòng khách hàng trên kênh OTA"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-primary" />
                              <span className="hidden xl:inline">Xem OTA</span>
                            </Link>
                            <button
                              type="button"
                              onClick={() => toggleExpand(prop.id)}
                              className="p-1.5 rounded-xl hover:bg-surface-container text-outline hover:text-on-surface transition-colors cursor-pointer"
                              title={isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-primary" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Sub-Row for Room Types */}
                      {isExpanded && (
                        <tr className="bg-surface-container-low/70">
                          <td colSpan={6} className="p-4 sm:p-5 border-y border-outline-variant/30">
                            <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 border border-outline-variant/30 shadow-2xs space-y-3">
                              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-outline-variant/20">
                                <div className="flex items-center gap-2">
                                  <BedDouble className="w-4 h-4 text-primary" />
                                  <span className="text-xs uppercase tracking-wider font-extrabold text-on-surface">
                                    Danh Sách Hạng Phòng & Giá Bán ({propRoomTypes.length})
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-tertiary font-semibold">
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>Đồng bộ tự động VietSage PMS</span>
                                </div>
                              </div>

                              {propRoomTypes.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs">
                                    <thead className="text-outline uppercase tracking-wider font-bold border-b border-outline-variant/20">
                                      <tr>
                                        <th className="py-2.5 px-3 min-w-[200px]">Tên Hạng Phòng</th>
                                        <th className="py-2.5 px-3 w-[140px] whitespace-nowrap">Sức Chứa</th>
                                        <th className="py-2.5 px-3 w-[160px] text-right whitespace-nowrap">Giá Tiêu Chuẩn</th>
                                        <th className="py-2.5 px-3 w-[180px] whitespace-nowrap">Mã Hạng Phòng PMS</th>
                                        <th className="py-2.5 px-3 text-right whitespace-nowrap">Trạng Thái Bán</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                                      {propRoomTypes.map((rt) => (
                                        <tr key={rt.id} className="hover:bg-surface-container-low/50 transition-colors">
                                          <td className="py-2.5 px-3">
                                            <div className="font-bold text-xs text-on-surface">{rt.name}</div>
                                            {rt.bed_type && (
                                              <div className="text-xs text-outline mt-0.5">
                                                {rt.bed_count ? `${rt.bed_count} ` : ''}{rt.bed_type}
                                                {rt.area_sqm ? ` • ${rt.area_sqm} m²` : ''}
                                              </div>
                                            )}
                                          </td>
                                          <td className="py-2.5 px-3 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1 text-xs text-outline font-medium">
                                              <Users className="w-3.5 h-3.5 text-outline" />
                                              <span>Tối đa {rt.max_guests} khách</span>
                                            </span>
                                          </td>
                                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                            <span className="font-mono text-xs font-black text-primary">
                                              {new Intl.NumberFormat('vi-VN', {
                                                style: 'currency',
                                                currency: 'VND',
                                              }).format(rt.base_price)}
                                            </span>
                                            <span className="text-xs text-outline font-normal"> /đêm</span>
                                          </td>
                                          <td className="py-2.5 px-3 whitespace-nowrap">
                                            {rt.vietsage_room_type_id ? (
                                              <span className="font-mono text-xs bg-surface-container px-2 py-0.5 rounded border border-outline-variant/30 text-on-surface">
                                                {rt.vietsage_room_type_id}
                                              </span>
                                            ) : (
                                              <span className="text-xs text-outline italic">Tự động map</span>
                                            )}
                                          </td>
                                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-semibold whitespace-nowrap">
                                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                              <span>Mở bán OTA</span>
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="py-6 text-center text-xs text-outline italic">
                                  Chưa có hạng phòng nào được thiết lập cho cơ sở lưu trú này.
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card View as alternative */
        <div className="grid grid-cols-1 gap-6">
          {filteredProperties.map((prop) => (
            <div
              key={prop.id}
              className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xs hover:shadow-xs transition-all overflow-hidden flex flex-col lg:flex-row"
            >
              {/* Left: Thumbnail & Badges */}
              <div className="lg:w-80 h-56 lg:h-auto relative shrink-0 bg-surface-container">
                {prop.thumbnail_url ? (
                  <Image
                    src={prop.thumbnail_url}
                    alt={prop.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 320px"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-outline">
                    <Building2 className="w-10 h-10 mb-2 opacity-50" />
                    <span className="text-xs">Chưa có ảnh</span>
                  </div>
                )}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-xs font-bold whitespace-nowrap">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{prop.star_rating} Sao</span>
                </div>
              </div>

              {/* Right: Property Details & Room Type Grid */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                    <div>
                      <h2 className="text-xl font-bold text-on-surface text-balance">{prop.name}</h2>
                      <div className="flex items-center gap-1.5 text-xs text-outline mt-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{prop.address}, {prop.city}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {prop.vietsage_hotel_id ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold whitespace-nowrap">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Đã liên kết VietSage:</span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-medium text-xs font-mono">
                              {prop.vietsage_hotel_email ||
                                (prop.vietsage_hotel_id?.includes('@')
                                  ? prop.vietsage_hotel_id
                                  : (prop.partner_email || 'Đã liên kết bảo mật'))}
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold whitespace-nowrap">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Chưa liên kết email đối tác VietSage</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(prop)}
                        className="px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>Liên Kết PMS / Sửa</span>
                      </button>
                      <Link
                        href={`/properties/${prop.id}`}
                        target="_blank"
                        className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-primary" />
                        <span>Xem Kênh OTA</span>
                      </Link>
                    </div>
                  </div>

                  {prop.description && (
                    <p className="text-xs text-outline line-clamp-2 leading-relaxed mt-2 text-pretty">
                      {prop.description}
                    </p>
                  )}
                </div>

                {/* Room Types Showcase */}
                <div className="space-y-3 pt-3 border-t border-outline-variant/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-extrabold text-outline">
                      Danh Sách Phòng & Giá Bán ({prop.room_types?.length || 0})
                    </span>
                    <span className="text-xs text-tertiary font-semibold">
                      Đồng bộ VietSage PMS
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {prop.room_types && prop.room_types.length > 0 ? (
                      prop.room_types.map((rt) => (
                        <div
                          key={rt.id}
                          className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between space-y-2"
                        >
                          <div>
                            <div className="font-bold text-xs text-on-surface truncate">{rt.name}</div>
                            <div className="flex items-center gap-2 text-xs text-outline mt-0.5">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>Tối đa {rt.max_guests} khách</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-baseline justify-between pt-1 border-t border-outline-variant/10">
                            <span className="text-xs text-outline font-medium">Giá tiêu chuẩn</span>
                            <span className="text-xs font-black text-primary">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rt.base_price)}
                              <span className="text-xs font-normal text-outline">/đêm</span>
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-outline italic col-span-full">
                        Chưa có hạng phòng nào được thiết lập.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. MODAL: ĐĂNG CƠ SỞ LƯU TRÚ MỚI */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface-container-lowest w-full max-w-5xl xl:max-w-6xl rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            <div className="p-5 sm:p-6 border-b border-outline-variant/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface">Đăng Cơ Sở Lưu Trú Mới</h3>
                  <p className="text-sm text-outline">Thêm khách sạn hoặc khu nghỉ dưỡng vào hệ sinh thái phân phối OTA</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-outline hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProperty} className="p-5 sm:p-8 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-start">
                {/* Left Column: Identifiers, location & classification */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-on-surface">Tên Khách Sạn / Resort *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nhập tên cơ sở lưu trú"
                      value={newPropName}
                      onChange={(e) => setNewPropName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface focus:outline-hidden focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-on-surface">Tỉnh / Thành Phố *</label>
                      <input
                        type="text"
                        required
                        placeholder="Tỉnh hoặc thành phố trực thuộc"
                        value={newPropCity}
                        onChange={(e) => setNewPropCity(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface focus:outline-hidden focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-on-surface">Hạng Sao</label>
                      <select
                        value={newPropStarRating}
                        onChange={(e) => setNewPropStarRating(parseFloat(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface focus:outline-hidden focus:border-primary cursor-pointer"
                      >
                        <option value={5.0}>5 Sao (Luxury Resort)</option>
                        <option value={4.5}>4.5 Sao (Premium)</option>
                        <option value={4.0}>4 Sao (Boutique / High-end)</option>
                        <option value={3.5}>3.5 Sao (Comfort)</option>
                        <option value={3.0}>3 Sao (Standard)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-on-surface">Địa Chỉ Chi Tiết *</label>
                    <input
                      type="text"
                      required
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện"
                      value={newPropAddress}
                      onChange={(e) => setNewPropAddress(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface focus:outline-hidden focus:border-primary"
                    />
                  </div>

                  <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-1.5">
                    <label className="text-sm font-semibold text-primary flex items-center justify-between">
                      <span>Email Đối Tác / Quản Trị VietSage PMS</span>
                      <span className="text-xs text-outline font-normal">Tùy chọn</span>
                    </label>
                    <input
                      type="email"
                      placeholder="partner@vietsage.vn"
                      value={newPropVietSageHotelId}
                      onChange={(e) => setNewPropVietSageHotelId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-sm text-on-surface focus:outline-hidden focus:border-primary font-medium"
                    />
                    <p className="text-xs text-outline text-pretty">
                      Liên kết tài khoản PMS của cơ sở lưu trú để tự động đồng bộ tồn kho và giá phòng.
                    </p>
                  </div>
                </div>

                {/* Right Column: Visuals & Narrative */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-on-surface">URL Hình Ảnh Đại Diện (Thumbnail)</label>
                    <input
                      type="url"
                      placeholder="https://domain.com/photo.jpg"
                      value={newPropThumbnail}
                      onChange={(e) => setNewPropThumbnail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface focus:outline-hidden focus:border-primary"
                    />
                    {newPropThumbnail && (
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-container">
                        <img
                          src={newPropThumbnail}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-on-surface">Mô Tả Giới Thiệu Cơ Sở</label>
                    <textarea
                      rows={newPropThumbnail ? 4 : 8}
                      placeholder="Mô tả tổng quan về vị trí địa lý, quy mô và dịch vụ tiện ích chính của khách sạn..."
                      value={newPropDescription}
                      onChange={(e) => setNewPropDescription(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface focus:outline-hidden focus:border-primary resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-outline-variant/40 text-sm font-semibold text-on-surface hover:bg-surface-container cursor-pointer transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-[#684f2c] text-on-primary text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang Lưu...' : 'Xác Nhận Đăng Khách Sạn'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: LIÊN KẾT VIETSAGE PMS & CHỈNH SỬA KHÁCH SẠN */}
      {editingProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface-container-lowest w-full max-w-5xl xl:max-w-6xl rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            <div className="p-5 sm:p-6 border-b border-outline-variant/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface">Kết Nối VietSage PMS & Chỉnh Sửa</h3>
                  <p className="text-sm text-outline">Liên kết tài khoản quản trị PMS hoặc cập nhật hồ sơ khách sạn</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingProperty(null)}
                className="p-2 text-outline hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProperty} className="p-5 sm:p-8 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-start">
                {/* Left Column: Essential identifiers & PMS connection */}
                <div className="space-y-4">
                  {/* VietSage Connection Section */}
                  <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-primary flex items-center gap-1.5">
                        <Link2 className="w-4 h-4" />
                        <span>Email Đối Tác / Quản Trị VietSage PMS</span>
                      </label>
                      {editPropVietSageHotelId && (
                        <button
                          type="button"
                          onClick={() => setEditPropVietSageHotelId('')}
                          className="text-xs text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                        >
                          Cắt Kết Nối
                        </button>
                      )}
                    </div>
                    <input
                      type="email"
                      placeholder="partner@vietsage.vn"
                      value={editPropVietSageHotelId}
                      onChange={(e) => setEditPropVietSageHotelId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-sm text-on-surface focus:outline-hidden focus:border-primary font-medium"
                    />
                    <p className="text-xs text-outline text-pretty">
                      {editPropVietSageHotelId
                        ? 'Đang liên kết bảo mật với VietSage PMS. Đơn đặt phòng OTA sẽ tự động đồng bộ.'
                        : 'Chưa có email liên kết. Nhập Email quản trị VietSage để kích hoạt kết nối tự động.'}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-on-surface">Tên Khách Sạn / Resort *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nhập tên cơ sở lưu trú"
                      value={editPropName}
                      onChange={(e) => setEditPropName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface focus:outline-hidden focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-on-surface">Tỉnh / Thành Phố *</label>
                      <input
                        type="text"
                        required
                        placeholder="Tỉnh hoặc thành phố trực thuộc"
                        value={editPropCity}
                        onChange={(e) => setEditPropCity(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface focus:outline-hidden focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-on-surface">Hạng Sao</label>
                      <select
                        value={editPropStarRating}
                        onChange={(e) => setEditPropStarRating(parseFloat(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface focus:outline-hidden focus:border-primary cursor-pointer"
                      >
                        <option value={5.0}>5 Sao (Luxury Resort)</option>
                        <option value={4.5}>4.5 Sao (Premium)</option>
                        <option value={4.0}>4 Sao (Boutique / High-end)</option>
                        <option value={3.5}>3.5 Sao (Comfort)</option>
                        <option value={3.0}>3 Sao (Standard)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-on-surface">Địa Chỉ Chi Tiết *</label>
                    <input
                      type="text"
                      required
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện"
                      value={editPropAddress}
                      onChange={(e) => setEditPropAddress(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface focus:outline-hidden focus:border-primary"
                    />
                  </div>
                </div>

                {/* Right Column: Visuals & Narrative */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-on-surface">URL Hình Ảnh Đại Diện (Thumbnail)</label>
                    <input
                      type="url"
                      placeholder="https://domain.com/photo.jpg"
                      value={editPropThumbnail}
                      onChange={(e) => setEditPropThumbnail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface focus:outline-hidden focus:border-primary"
                    />
                    {editPropThumbnail && (
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-container">
                        <img
                          src={editPropThumbnail}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-on-surface">Mô Tả Giới Thiệu</label>
                    <textarea
                      rows={editPropThumbnail ? 4 : 8}
                      placeholder="Mô tả tổng quan về khách sạn..."
                      value={editPropDescription}
                      onChange={(e) => setEditPropDescription(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface focus:outline-hidden focus:border-primary resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setEditingProperty(null)}
                  className="px-4 py-2.5 rounded-xl border border-outline-variant/40 text-sm font-semibold text-on-surface hover:bg-surface-container cursor-pointer transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-[#684f2c] text-on-primary text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isEditSubmitting ? 'Đang Lưu...' : 'Lưu Thay Đổi & Kết Nối'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

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
  RefreshCw,
  Hotel,
  Plus,
  X,
  Save,
} from 'lucide-react';
import {
  usePropertiesQuery,
  useCreatePropertyMutation,
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

  // Create Property Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPropName, setNewPropName] = useState('');
  const [newPropCity, setNewPropCity] = useState('Phú Quốc');
  const [newPropAddress, setNewPropAddress] = useState('');
  const [newPropDescription, setNewPropDescription] = useState('');
  const [newPropStarRating, setNewPropStarRating] = useState(5.0);
  const [newPropThumbnail, setNewPropThumbnail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createPropertyMutation = useCreatePropertyMutation();

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
      });
      await luxuryAlert.success({
        title: 'Đăng Cơ Sở Thành Công',
        message: 'Đăng cơ sở lưu trú mới thành công vào hệ thống!',
        confirmText: 'Hoàn Tất',
      });
      setIsCreateModalOpen(false);
      setNewPropName('');
      setNewPropAddress('');
      setNewPropDescription('');
      setNewPropThumbnail('');
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể đăng cơ sở lưu trú';
      luxuryAlert.error({
        title: 'Đăng Cơ Sở Thất Bại',
        message,
      });
    } finally {
      setIsSubmitting(false);
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
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
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
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
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
            className="inline-block px-6 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
          >
            Tải Lại Danh Mục
          </button>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="py-20 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant/30 text-outline text-xs">
          Không tìm thấy cơ sở lưu trú nào phù hợp với bộ lọc.
        </div>
      ) : (
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
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{prop.star_rating} Sao</span>
                </div>
              </div>

              {/* Right: Property Details & Room Type Grid */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                    <div>
                      <h2 className="text-xl font-bold text-on-surface">{prop.name}</h2>
                      <div className="flex items-center gap-1.5 text-xs text-outline mt-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{prop.address}, {prop.city}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <Link
                        href={`/partner/rooms?propertyId=${prop.id}`}
                        className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <BedDouble className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Quản Lý Phòng</span>
                      </Link>
                      <Link
                        href={`/properties/${prop.id}`}
                        target="_blank"
                        className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-primary" />
                        <span>Xem Kênh OTA</span>
                      </Link>
                    </div>
                  </div>

                  {prop.description && (
                    <p className="text-xs text-outline line-clamp-2 leading-relaxed mt-2">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface-container-lowest w-full max-w-xl rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Đăng Cơ Sở Lưu Trú Mới</h3>
                  <p className="text-xs text-outline">Thêm khách sạn hoặc resort vào hệ sinh thái phân phối OTA</p>
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

            <form onSubmit={handleCreateProperty} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface">Tên Khách Sạn / Resort *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Sunset Sanato Resort & Villas"
                  value={newPropName}
                  onChange={(e) => setNewPropName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface">Tỉnh / Thành Phố *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Phú Quốc"
                    value={newPropCity}
                    onChange={(e) => setNewPropCity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface focus:outline-hidden focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface">Hạng Sao</label>
                  <select
                    value={newPropStarRating}
                    onChange={(e) => setNewPropStarRating(parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface focus:outline-hidden focus:border-primary cursor-pointer"
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
                <label className="text-xs font-bold text-on-surface">Địa Chỉ Chi Tiết *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bãi Trường, Xã Dương Tơ, TP. Phú Quốc, Kiên Giang"
                  value={newPropAddress}
                  onChange={(e) => setNewPropAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface">URL Hình Ảnh Đại Diện (Thumbnail)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newPropThumbnail}
                  onChange={(e) => setNewPropThumbnail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface">Mô Tả Giới Thiệu Cơ Sở</label>
                <textarea
                  rows={3}
                  placeholder="Khu nghỉ dưỡng 5 sao tiêu chuẩn quốc tế tọa lạc bên bờ biển nguyên sơ..."
                  value={newPropDescription}
                  onChange={(e) => setNewPropDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface focus:outline-hidden focus:border-primary resize-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-outline-variant/40 text-xs font-bold text-on-surface hover:bg-surface-container cursor-pointer transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-[#684f2c] text-on-primary text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang Lưu...' : 'Xác Nhận Đăng Cơ Sở'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import {
  Building2,
  MapPin,
  Star,
  Save,
  RotateCcw,
  Sparkles,
  Image as ImageIcon,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Hotel,
} from 'lucide-react';
import {
  usePropertyDetailQuery,
  useUpdatePropertyMutation,
} from '@/features/catalog/hooks/use-catalog';
import { luxuryAlert } from '@/lib/alert/luxury-alert';


const POPULAR_DESTINATIONS = [
  'Hà Nội',
  'Hồ Chí Minh',
  'Đà Nẵng',
  'Nha Trang',
  'Phú Quốc',
  'Đà Lạt',
  'Sa Pa',
  'Hội An',
  'Hạ Long',
  'Huế',
  'Quy Nhơn',
  'Vũng Tàu',
];

export default function PartnerPropertiesPage() {
  const { data: session, status: authStatus } = useSession();

  const user = session?.user as
    | {
        role?: string;
        managedPropertyId?: string | null;
        accessibleProperties?: Array<{ id: string; name: string }>;
      }
    | undefined;

  const managedPropertyId = user?.managedPropertyId ?? '';

  const {
    data: property,
    isLoading,
    refetch,
  } = usePropertyDetailQuery(managedPropertyId, {
    enabled: authStatus === 'authenticated' && Boolean(managedPropertyId),
  });

  const updatePropertyMutation = useUpdatePropertyMutation();

  // Form states
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [starRating, setStarRating] = useState(4.0);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when property data loads
  useEffect(() => {
    if (property) {
      setName(property.name || '');
      setCity(property.city || '');
      setAddress(property.address || '');
      setDescription(property.description || '');
      setStarRating(property.star_rating ?? 4.0);
      setThumbnailUrl(property.thumbnail_url || '');
      setImages(Array.isArray(property.images) ? property.images : []);
    }
  }, [property]);

  const handleReset = async () => {
    if (property) {
      setName(property.name || '');
      setCity(property.city || '');
      setAddress(property.address || '');
      setDescription(property.description || '');
      setStarRating(property.star_rating ?? 4.0);
      setThumbnailUrl(property.thumbnail_url || '');
      setImages(Array.isArray(property.images) ? property.images : []);
      setNewImageUrl('');
      await luxuryAlert.info({
        title: 'Khôi Phục Dữ Liệu',
        message: 'Đã hoàn tác và khôi phục thông tin ban đầu của cơ sở lưu trú.',
        confirmText: 'Đã Hiểu',
      });
    }
  };

  const handleAddImage = async () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;
    if (images.includes(trimmed)) {
      await luxuryAlert.warning({
        title: 'Hình Ảnh Đã Tồn Tại',
        message: 'Đường dẫn hình ảnh này đã có trong danh mục của khách sạn.',
        confirmText: 'Đã Hiểu',
      });
      return;
    }
    setImages([...images, trimmed]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages(images.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managedPropertyId) {
      luxuryAlert.error({
        title: 'Lỗi Phân Quyền',
        message: 'Tài khoản không được gán mã cơ sở lưu trú để cập nhật.',
      });
      return;
    }

    if (!name.trim() || !city.trim() || !address.trim()) {
      luxuryAlert.error({
        title: 'Thiếu Thông Tin Bắt Buộc',
        message: 'Vui lòng điền đầy đủ tên khách sạn, thành phố và địa chỉ chi tiết.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePropertyMutation.mutateAsync({
        id: managedPropertyId,
        payload: {
          name: name.trim(),
          city: city.trim(),
          address: address.trim(),
          description: description.trim() || undefined,
          star_rating: Number(starRating),
          thumbnail_url: thumbnailUrl.trim() || undefined,
          images: images.length > 0 ? images : undefined,
        },
      });

      await luxuryAlert.success({
        title: 'Cập Nhật Thành Công',
        message: 'Thông tin cơ sở lưu trú đã được lưu thành công trên hệ thống.',
        confirmText: 'Đã Hiểu',
      });
      await refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể lưu cài đặt khách sạn';
      luxuryAlert.error({
        title: 'Cập Nhật Thất Bại',
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10 space-y-6">
        <div className="h-8 w-64 bg-slate-200/80 rounded-xl animate-pulse" />
        <div className="h-4 w-96 bg-slate-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="md:col-span-2 h-96 bg-white rounded-3xl border border-slate-200/80 p-6 animate-pulse" />
          <div className="h-96 bg-white rounded-3xl border border-slate-200/80 p-6 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-800 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
            <Hotel className="w-4 h-4 text-emerald-700" />
            <span>Cài Đặt Cơ Sở</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-950 font-bold whitespace-nowrap">
              {property?.name || 'Khách sạn đối tác'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-balance">
            Cài Đặt Khách Sạn
          </h1>
          <p className="text-sm sm:text-base text-slate-600 text-pretty">
            Cấu hình thông tin cơ sở lưu trú, mô tả dịch vụ và hình ảnh hiển thị trên sàn OTA VietSage.
          </p>
        </div>
      </div>

      {/* 2. FORM BODY */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* LEFT 2 COLUMNS: Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1: Core Profile */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 text-balance">
                      Thông Tin Định Danh &amp; Địa Lý
                    </h2>
                    <p className="text-xs text-slate-500 text-pretty">
                      Tên gọi chính thức và vị trí cơ sở hiển thị cho du khách
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Kênh Bán Đang Mở</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                    Tên cơ sở lưu trú <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Sapa Cloud Sanctuary Resort & Spa"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-700 bg-slate-50/50 text-sm font-medium text-slate-900 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                      Điểm đến / Thành phố <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        list="destinations-list"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Chọn hoặc nhập điểm đến..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-700 bg-slate-50/50 text-sm font-medium text-slate-900 transition-colors"
                      />
                      <datalist id="destinations-list">
                        {POPULAR_DESTINATIONS.map((d) => (
                          <option key={d} value={d} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                      Tiêu chuẩn hạng sao
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={starRating}
                        onChange={(e) => setStarRating(parseFloat(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-700 bg-slate-50/50 text-sm font-bold text-slate-900 transition-colors cursor-pointer"
                      >
                        <option value="5.0">5 Sao Thượng Lưu (Luxury Standard)</option>
                        <option value="4.5">4.5 Sao Bán Thượng Lưu</option>
                        <option value="4.0">4 Sao Cao Cấp (Premium Standard)</option>
                        <option value="3.5">3.5 Sao Tiêu Chuẩn</option>
                        <option value="3.0">3 Sao Tiện Nghi (Comfort Standard)</option>
                      </select>
                      <div className="flex items-center gap-0.5 text-amber-500 shrink-0 px-2 py-2 rounded-xl bg-amber-50 border border-amber-200/60">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                        <span className="text-xs font-black">{starRating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                    Địa chỉ chi tiết <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-700 bg-slate-50/50 text-sm font-medium text-slate-900 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Narrative Description */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 text-balance">
                    Giới Thiệu Cơ Sở Lưu Trú
                  </h2>
                  <p className="text-xs text-slate-500 text-pretty">
                    Nội dung mô tả không gian, tầm nhìn và phong cách phục vụ của khách sạn
                  </p>
                </div>
              </div>

              <div>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả trải nghiệm nghỉ dưỡng, cảnh quan thiên nhiên, vị trí đặc quyền và tiện ích nổi bật..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-700 bg-slate-50/50 text-sm text-slate-900 leading-relaxed font-normal transition-colors"
                />
                <span className="text-xs text-slate-400 mt-1 block">
                  Độ dài lý tưởng từ 100 đến 300 từ để tối ưu khả năng hiển thị và chuyển đổi đặt phòng.
                </span>
              </div>
            </div>

            {/* Card 3: Photo Gallery */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 text-balance">
                      Bộ Sưu Tập Hình Ảnh
                    </h2>
                    <p className="text-xs text-slate-500 text-pretty">
                      Danh sách ảnh thực tế về khuôn viên, sảnh và cảnh quan cơ sở
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                  {images.length} hình ảnh
                </span>
              </div>

              {/* Add New Image Input */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Dán đường dẫn ảnh HTTPS (Unsplash, Cloudinary, CDN)..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-700 bg-slate-50/50 text-sm text-slate-900 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-bold shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm ảnh</span>
                </button>
              </div>

              {/* Gallery Grid */}
              {images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {images.map((imgUrl, index) => (
                    <div
                      key={index}
                      className="group relative h-28 sm:h-32 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100"
                    >
                      <Image
                        src={imgUrl}
                        alt={`Khách sạn ảnh ${index + 1}`}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="p-2 rounded-xl bg-rose-600/90 text-white hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
                          title="Xóa ảnh này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-center">
                  <p className="text-xs text-slate-500 font-medium">
                    Chưa có ảnh trong bộ sưu tập. Hãy dán link ảnh ở trên để bổ sung.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT 1 COLUMN: Thumbnail Preview & Ecosystem Information */}
          <div className="space-y-6">
            {/* Card 4: Primary Thumbnail Preview */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 text-balance">
                Ảnh Đại Diện Chính (Thumbnail)
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Đường dẫn ảnh đại diện
                </label>
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-700 bg-slate-50/50 text-xs sm:text-sm text-slate-900 transition-colors font-mono"
                />
              </div>

              {/* Live Preview Box */}
              <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                {thumbnailUrl ? (
                  <Image
                    src={thumbnailUrl}
                    alt={name || 'Ảnh đại diện khách sạn'}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 p-4">
                    <ImageIcon className="w-8 h-8 stroke-1 text-slate-300" />
                    <span className="text-xs font-medium">Chưa có ảnh đại diện</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 leading-normal text-pretty">
                Ảnh này xuất hiện đầu tiên trên kết quả tìm kiếm OTA và đầu trang chi tiết khách sạn.
              </p>
            </div>

            {/* Card 5: VietSage PMS Ecosystem Boundary */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold tracking-tight">Ranh Giới VietSage PMS</h3>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Mã cơ sở OTA:</span>
                  <span className="font-mono font-bold text-slate-800 truncate max-w-[150px]">
                    {property?.id || managedPropertyId}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Định danh Slug:</span>
                  <span className="font-mono font-bold text-slate-800 truncate max-w-[150px]">
                    {property?.slug || 'chưa-tạo'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Trạng thái đồng bộ:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-800 whitespace-nowrap">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Đã kết nối</span>
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-normal text-pretty pt-1">
                booking-manager quản lý các cấu hình thương mại OTA. Quyền sở hữu buồng phòng vật lý và check-in/out thuộc PMS VietSage.
              </p>
            </div>

            {/* Public Link Card */}
            {property?.id && (
              <Link
                href={`/properties/${property.id}`}
                target="_blank"
                className="group p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-emerald-500/50 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                      Xem trang công khai
                    </div>
                    <div className="text-xs text-slate-400">Trải nghiệm của du khách</div>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* 3. STICKY ACTION BAR */}
        <div className="sticky bottom-6 z-30 p-4 sm:p-5 rounded-3xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>Mọi thay đổi sẽ có hiệu lực ngay lập tức trên hệ thống tìm kiếm phòng OTA.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-xs sm:text-sm font-bold text-slate-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Khôi phục</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang lưu cài đặt...' : 'Lưu Thay Đổi'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

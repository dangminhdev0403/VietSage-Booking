'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Star,
  MapPin,
  ChevronRight,
  Wifi,
  Waves,
  Sparkles,
  UtensilsCrossed,
  Car,
  CheckCircle2,
  Check,
  UserCheck,
  Building2,
  BedDouble,
  Users,
  Maximize2,
  Bed,
  ShieldCheck,
} from 'lucide-react';
import { usePropertyDetailQuery } from '@/features/catalog/hooks/use-catalog';
import { Property } from '@/features/catalog/components/property-card';
import { BookingModal } from '@/features/bookings/components/booking-modal';

function PropertyDetailContent() {
  const routeParams = useParams();
  const id = typeof routeParams?.id === 'string' ? routeParams.id : '';
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [preselectedRoomId, setPreselectedRoomId] = useState<string | undefined>(undefined);

  const {
    data: property,
    isLoading: loading,
    error,
  } = usePropertyDetailQuery(id, { enabled: Boolean(id) });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-base font-semibold text-outline">Đang kết nối khu nghỉ dưỡng thượng lưu...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold text-on-surface">Không tìm thấy khách sạn</h2>
          <p className="text-base text-outline">
            {error instanceof Error ? error.message : 'Cơ sở lưu trú không tồn tại hoặc đã ngừng hoạt động.'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-bold text-base shadow hover:bg-primary-container hover:text-on-primary-container transition-all"
          >
            Về Trang Chủ
          </Link>
        </div>
      </div>
    );
  }

  const roomTypes = property.room_types || [];
  const realGallery = [
    ...(property.thumbnail_url ? [property.thumbnail_url] : []),
    ...(property.images || []),
  ].filter((url, idx, arr): url is string => Boolean(url) && arr.indexOf(url) === idx);
  const hasRealGallery = realGallery.length > 0;

  const lowestPrice = roomTypes.length > 0
    ? Math.min(...roomTypes.map((r) => r.base_price))
    : 2450000;

  return (
    <div className="min-h-screen bg-background text-on-surface pb-24 lg:pb-12">
      {/* Breadcrumb & Title Bar */}
      <section className="bg-surface-bright py-6 border-b border-outline-variant/20">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-outline mb-4">
            <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>{property.city}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-on-surface font-semibold">{property.name}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-container/25 text-on-primary-container text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Boutique Collection
                </span>
                <div className="flex items-center text-primary">
                  {Array.from({ length: Math.min(5, Math.floor(property.star_rating || 5)) }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                  <span className="text-xs font-bold text-on-surface ml-1.5">{property.star_rating} Sao</span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-extrabold text-on-surface tracking-tight">
                {property.name}
              </h1>

              <p className="text-base text-outline flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span>{property.address}, {property.city}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsBookingModalOpen(true)}
                className="h-12 px-8 rounded-full bg-primary text-on-primary font-bold text-base hover:bg-primary-container hover:text-on-primary-container transition-all shadow-md cursor-pointer"
              >
                Đặt Phòng Ngay • Từ {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(lowestPrice)}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Showcase / Architectural Showcase Section */}
      <section className="py-8 max-w-[1320px] mx-auto px-6 lg:px-12">
        {hasRealGallery ? (
          realGallery.length >= 3 ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 h-[420px] sm:h-[500px] rounded-3xl overflow-hidden shadow-lg border border-outline-variant/30">
              <div className="md:col-span-8 h-full relative group overflow-hidden">
                <img
                  src={realGallery[0]}
                  alt={property.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute bottom-4 left-4 px-4 py-1.5 rounded-full bg-surface-bright/90 backdrop-blur-md text-on-surface text-xs font-bold whitespace-nowrap">
                  Khuôn viên toàn cảnh
                </div>
              </div>
              <div className="md:col-span-4 grid grid-rows-2 gap-3 h-full">
                <div className="relative group overflow-hidden">
                  <img
                    src={realGallery[1]}
                    alt="Không gian phòng nghỉ"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-surface-bright/85 text-xs font-semibold whitespace-nowrap">
                    Không gian sang trọng
                  </div>
                </div>
                <div className="relative group overflow-hidden">
                  <img
                    src={realGallery[2]}
                    alt="Tiện nghi nghỉ dưỡng"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-surface-bright/85 text-xs font-semibold whitespace-nowrap">
                    Tiện ích biểu tượng
                  </div>
                </div>
              </div>
            </div>
          ) : realGallery.length === 2 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-[380px] sm:h-[460px] rounded-3xl overflow-hidden shadow-lg border border-outline-variant/30">
              <div className="h-full relative group overflow-hidden">
                <img
                  src={realGallery[0]}
                  alt={property.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>
              <div className="h-full relative group overflow-hidden">
                <img
                  src={realGallery[1]}
                  alt="Không gian phòng nghỉ"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>
            </div>
          ) : (
            <div className="h-[380px] sm:h-[460px] rounded-3xl overflow-hidden shadow-lg border border-outline-variant/30 relative group">
              <img
                src={realGallery[0]}
                alt={property.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute bottom-4 left-4 px-4 py-1.5 rounded-full bg-surface-bright/90 backdrop-blur-md text-on-surface text-xs font-bold whitespace-nowrap">
                Toàn cảnh cơ sở lưu trú
              </div>
            </div>
          )
        ) : (
          /* Graceful Architectural Showcase Banner for 0-photo hotel */
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0e1c17] via-[#162f27] to-[#1f4337] border border-[#c5a880]/30 shadow-xl p-8 sm:p-12 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(197,168,128,0.18),transparent_60%)] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#2a594b]/20 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 max-w-3xl space-y-6">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-[#d4af37] uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                  <Building2 className="w-3.5 h-3.5" />
                  Khu Nghỉ Dưỡng Đối Tác Đã Xác Thực
                </span>
                <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold whitespace-nowrap">
                  Sẵn sàng nhận khách đặt phòng
                </span>
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-black text-white tracking-tight text-balance">
                  {property.name}
                </h2>
                <p className="text-base text-gray-200/90 leading-relaxed text-pretty">
                  {property.description || 'Cơ sở lưu trú đã hoàn tất kết nối hệ thống quản lý phòng VietSage PMS và mở cổng nhận đặt phòng trực tuyến. Toàn bộ thông số phòng, tiện nghi và bảng giá đã được xác thực an toàn.'}
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/30 backdrop-blur-md border border-white/10 whitespace-nowrap">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Xác nhận phòng tức thì 24/7
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/30 backdrop-blur-md border border-white/10 whitespace-nowrap">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                    Cam kết giá trực tuyến tốt nhất
                  </span>
                </div>
                <button
                  onClick={() => {
                    setPreselectedRoomId(undefined);
                    setIsBookingModalOpen(true);
                  }}
                  className="h-11 px-7 rounded-full bg-[#d4af37] text-[#12231e] font-bold text-sm hover:bg-[#c5a880] transition-all shadow-md cursor-pointer whitespace-nowrap active:scale-95"
                >
                  Chọn Hạng Phòng &amp; Đặt Ngay
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Main Content: Overview, Rooms & Amenities */}
      <section className="max-w-[1320px] mx-auto px-6 lg:px-12 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Left Column: Details & Room Selection */}
        <div className="lg:col-span-8 space-y-8 lg:space-y-10">
          {/* Overview */}
          <div className="space-y-4">
            <h2 className="text-2xl font-sans font-bold text-on-surface">Giới Thiệu Nghỉ Dưỡng</h2>
            <p className="text-base text-on-surface-variant leading-relaxed">
              {property.description || 'Khu nghỉ dưỡng tọa lạc tại vị trí đắc địa, mang đến trải nghiệm lưu trú thượng lưu với dịch vụ chăm sóc cá nhân hóa, ẩm thực trác tuyệt và cảnh quan thiên nhiên tráng lệ.'}
            </p>
          </div>

          {/* Iconic Amenities - Compact & Elegant */}
          <div className="space-y-3">
            <h2 className="text-xl font-sans font-bold text-on-surface">Tiện Nghi Đặc Quyền</h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-semibold text-on-surface">
                <Waves className="w-3.5 h-3.5 text-primary" />
                Hồ bơi vô cực
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-semibold text-on-surface">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Spa &amp; Trị liệu Hoàng gia
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-semibold text-on-surface">
                <UtensilsCrossed className="w-3.5 h-3.5 text-primary" />
                Ẩm thực Fusion cao cấp
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-semibold text-on-surface">
                <UserCheck className="w-3.5 h-3.5 text-primary" />
                Quản gia riêng 24/7
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-semibold text-on-surface">
                <Car className="w-3.5 h-3.5 text-primary" />
                Đưa đón sân bay VIP
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-semibold text-on-surface">
                <Wifi className="w-3.5 h-3.5 text-primary" />
                Wifi tốc độ cao
              </span>
            </div>
          </div>

          {/* Room Types Catalog */}
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-sans font-bold text-on-surface">Danh Mục Hạng Phòng</h2>
                <p className="text-base text-outline mt-1">Được thiết kế tỉ mỉ theo tiêu chuẩn Quiet Luxury</p>
              </div>
            </div>

            <div className="space-y-4">
              {roomTypes.map((rt) => {
                const roomPhoto =
                  rt.room_images && rt.room_images.length > 0
                    ? rt.room_images[0]
                    : property.thumbnail_url || (property.images && property.images.length > 0 ? property.images[0] : null);

                const isTechDescription =
                  rt.description?.toLowerCase().includes('đồng bộ tự động') ||
                  rt.description?.toLowerCase().includes('sync');
                const displayDescription = isTechDescription ? null : rt.description;

                // Loại bớt các tiện ích trùng lặp với cấp khách sạn (Wifi) hoặc hiển nhiên (nước nóng, vòi sen)
                const distinctAmenities = (rt.amenities || [])
                  .filter((am) => {
                    const l = am.toLowerCase();
                    return (
                      !l.includes('wifi') &&
                      !l.includes('internet') &&
                      !l.includes('nước nóng') &&
                      !l.includes('vòi sen')
                    );
                  })
                  .map((am) => {
                    if (am.toLowerCase().includes('điều hòa')) return 'Điều hòa 2 chiều';
                    if (am.toLowerCase().includes('tv')) return 'Smart TV';
                    if (am.toLowerCase().includes('két')) return 'Két an toàn';
                    return am;
                  });

                return (
                  <div
                    key={rt.id}
                    className="group bg-surface-container-lowest rounded-2xl sm:rounded-3xl border border-outline-variant/30 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col md:flex-row items-stretch"
                  >
                    {/* Left: Edge-to-edge Room Photo (Zero padding, flush to container) */}
                    {roomPhoto ? (
                      <div className="relative w-full md:w-56 lg:w-64 shrink-0 aspect-[16/10] md:aspect-auto overflow-hidden bg-surface-container">
                        <img
                          src={roomPhoto}
                          alt={rt.name}
                          className="w-full h-full min-h-[170px] md:min-h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {rt.room_images && rt.room_images.length > 1 && (
                          <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/65 text-white text-xs font-semibold backdrop-blur-xs whitespace-nowrap">
                            +{rt.room_images.length - 1} ảnh
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="relative w-full md:w-36 lg:w-40 shrink-0 bg-surface-container-low flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-outline-variant/20">
                        <BedDouble className="w-8 h-8 text-primary/70" />
                        <span className="text-xs text-outline font-semibold mt-1.5 whitespace-nowrap">
                          {rt.name}
                        </span>
                      </div>
                    )}

                    {/* Middle: Horizontal & Balanced Room Info */}
                    <div className="flex-1 p-4 sm:p-5 lg:p-6 flex flex-col justify-between min-w-0 gap-3">
                      <div className="space-y-2">
                        {/* Title & View Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-lg sm:text-xl font-bold text-on-surface tracking-tight text-balance">
                            {rt.name}
                          </h3>
                          {rt.has_sea_view && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-xs font-semibold whitespace-nowrap shrink-0">
                              <Waves className="w-3 h-3 text-sky-600" />
                              Hướng Biển
                            </span>
                          )}
                        </div>

                        {displayDescription && (
                          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed line-clamp-1">
                            {displayDescription}
                          </p>
                        )}

                        {/* Core Room Specs - Horizontal Inline Row */}
                        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-on-surface-variant font-medium pt-0.5">
                          <span className="inline-flex items-center gap-1.5 text-primary font-semibold whitespace-nowrap">
                            <Users className="w-3.5 h-3.5" />
                            Tối đa {rt.max_guests} khách
                          </span>
                          {rt.bed_type && (
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                              <BedDouble className="w-3.5 h-3.5 text-outline" />
                              {rt.bed_type}
                            </span>
                          )}
                          {rt.area_sqm && (
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                              <Maximize2 className="w-3.5 h-3.5 text-outline" />
                              {rt.area_sqm} m²
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold whitespace-nowrap">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Còn phòng
                          </span>
                        </div>
                      </div>

                      {/* Distinctive In-Room Equipment - Single Compact Line (Zero bloat) */}
                      {distinctAmenities.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant/20 text-xs">
                          {distinctAmenities.map((am, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-0.5 rounded-md bg-surface-container/70 border border-outline-variant/20 text-xs font-medium text-on-surface whitespace-nowrap"
                            >
                              {am}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: Price & CTA Box (Dedicated compact right column) */}
                    <div className="w-full md:w-52 lg:w-56 shrink-0 p-4 sm:p-5 lg:p-6 md:border-l border-t md:border-t-0 border-outline-variant/30 bg-surface-container-low/40 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 text-left md:text-right">
                      <div className="text-left md:text-right">
                        <span className="text-xs text-outline uppercase font-bold tracking-wider block">
                          Giá mỗi đêm
                        </span>
                        <div className="text-xl lg:text-2xl font-black text-primary tracking-tight">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rt.base_price)}
                        </div>
                        <span className="text-xs text-tertiary font-medium block">
                          Đã gồm thuế &amp; phí
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setPreselectedRoomId(rt.id);
                          setIsBookingModalOpen(true);
                        }}
                        className="h-10 px-5 rounded-full bg-primary hover:bg-[#684f2c] text-on-primary font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs whitespace-nowrap active:scale-95"
                      >
                        Đặt Hạng Phòng
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Sticky Booking Box */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-28 bg-surface-container-lowest rounded-3xl p-7 border border-outline-variant/40 shadow-lg space-y-6">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-outline">Bắt đầu kỳ nghỉ</span>
              <div className="text-3xl font-black text-primary mt-1">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(lowestPrice)}
                <span className="text-base font-normal text-outline"> / đêm</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface space-y-2">
              <div className="flex items-center gap-2 font-bold text-primary">
                <CheckCircle2 className="w-4 h-4" />
                <span>Cam kết giá tốt nhất độc quyền</span>
              </div>
              <p className="text-on-surface-variant leading-relaxed text-pretty">
                Tích lũy điểm hội viên VietSageBooking VIP Club và nhận quyền lợi ưu đãi trực tuyến.
              </p>
            </div>

            <button
              onClick={() => {
                setPreselectedRoomId(undefined);
                setIsBookingModalOpen(true);
              }}
              className="w-full h-14 rounded-full bg-primary text-on-primary font-bold text-base hover:bg-primary-container hover:text-on-primary-container transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Tiến Hành Đặt Phòng</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Mobile Sticky Bottom Booking Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-bright/95 backdrop-blur-md border-t border-outline-variant/30 px-5 py-3 shadow-[0_-8px_20px_rgba(0,0,0,0.08)] flex items-center justify-between">
        <div>
          <span className="text-xs text-outline uppercase font-bold block">Giá từ</span>
          <div className="text-xl font-black text-primary leading-tight">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(lowestPrice)}
            <span className="text-xs font-normal text-outline"> / đêm</span>
          </div>
        </div>
        <button
          onClick={() => {
            setPreselectedRoomId(undefined);
            setIsBookingModalOpen(true);
          }}
          className="h-11 px-6 rounded-full bg-primary hover:bg-[#684f2c] text-on-primary font-bold text-sm shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
        >
          Đặt Phòng Ngay
        </button>
      </div>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <BookingModal
          property={property}
          initialRoomId={preselectedRoomId}
          onClose={() => {
            setIsBookingModalOpen(false);
            setPreselectedRoomId(undefined);
          }}
        />
      )}
    </div>
  );
}

export default function PropertyDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-base font-semibold text-outline">Đang kết nối khu nghỉ dưỡng thượng lưu...</p>
          </div>
        </div>
      }
    >
      <PropertyDetailContent />
    </React.Suspense>
  );
}


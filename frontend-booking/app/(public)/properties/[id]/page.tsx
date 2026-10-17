'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Star,
  MapPin,
  ChevronRight,
  Shield,
  Wifi,
  Waves,
  Sparkles,
  UtensilsCrossed,
  Clock,
  Car,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { getProperty } from '@/features/catalog/service/catalog.client';
import { Property } from '@/features/catalog/components/property-card';
import { BookingModal } from '@/features/bookings/components/booking-modal';

function PropertyDetailContent() {
  const routeParams = useParams();
  const id = typeof routeParams?.id === 'string' ? routeParams.id : '';
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    getProperty(id)
      .then((data) => {
        setProperty(data as Property);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Không thể tải thông tin khách sạn');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-outline">Đang kết nối khu nghỉ dưỡng thượng lưu...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold text-on-surface">Không tìm thấy khách sạn</h2>
          <p className="text-sm text-outline">{error || 'Cơ sở lưu trú không tồn tại hoặc đã ngừng hoạt động.'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-bold text-sm shadow hover:bg-primary-container hover:text-on-primary-container transition-all"
          >
            Về Trang Chủ
          </Link>
        </div>
      </div>
    );
  }

  const roomTypes = property.room_types || [];
  const galleryImages = (property.images && property.images.length > 0)
    ? property.images
    : [
        property.thumbnail_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
      ];

  const lowestPrice = roomTypes.length > 0
    ? Math.min(...roomTypes.map((r) => r.base_price))
    : 2450000;

  return (
    <div className="min-h-screen bg-background text-on-surface">
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

              <p className="text-sm text-outline flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span>{property.address}, {property.city}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsBookingModalOpen(true)}
                className="h-12 px-8 rounded-full bg-primary text-on-primary font-bold text-sm hover:bg-primary-container hover:text-on-primary-container transition-all shadow-md cursor-pointer"
              >
                Đặt Phòng Ngay • Từ {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(lowestPrice)}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Mosaic Gallery */}
      <section className="py-8 max-w-[1320px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 h-[420px] sm:h-[500px] rounded-3xl overflow-hidden shadow-lg border border-outline-variant/30">
          <div className="md:col-span-8 h-full relative group overflow-hidden">
            <img
              src={galleryImages[0]}
              alt={property.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute bottom-4 left-4 px-4 py-1.5 rounded-full bg-surface-bright/90 backdrop-blur-md text-on-surface text-xs font-bold">
              Khuôn viên toàn cảnh
            </div>
          </div>
          <div className="md:col-span-4 grid grid-rows-2 gap-3 h-full">
            <div className="relative group overflow-hidden">
              <img
                src={galleryImages[1] || galleryImages[0]}
                alt="Room detail"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-surface-bright/85 text-[11px] font-semibold">
                Không gian sang trọng
              </div>
            </div>
            <div className="relative group overflow-hidden">
              <img
                src={galleryImages[2] || galleryImages[0]}
                alt="Amenities"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-surface-bright/85 text-[11px] font-semibold">
                Tiện ích biểu tượng
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Overview, Rooms & Amenities */}
      <section className="max-w-[1320px] mx-auto px-6 lg:px-12 py-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Details & Room Selection */}
        <div className="lg:col-span-8 space-y-12">
          {/* Overview */}
          <div className="space-y-4">
            <h2 className="text-2xl font-sans font-bold text-on-surface">Giới Thiệu Nghỉ Dưỡng</h2>
            <p className="text-base text-on-surface-variant leading-relaxed">
              {property.description || 'Khu nghỉ dưỡng tọa lạc tại vị trí đắc địa, mang đến trải nghiệm lưu trú thượng lưu với dịch vụ chăm sóc cá nhân hóa, ẩm thực trác tuyệt và cảnh quan thiên nhiên tráng lệ.'}
            </p>
          </div>

          {/* Iconic Amenities */}
          <div className="space-y-5">
            <h2 className="text-2xl font-sans font-bold text-on-surface">Tiện Nghi Đặc Quyền</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                <Waves className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold">Hồ bơi vô cực</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold">Spa &amp; Trị liệu Hoàng gia</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                <UtensilsCrossed className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold">Ẩm thực Fusion cao cấp</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                <UserCheck className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold">Quản gia riêng 24/7</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                <Car className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold">Đưa đón sân bay VIP</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                <Wifi className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold">Wifi 6 tốc độ cao</span>
              </div>
            </div>
          </div>

          {/* Room Types Catalog */}
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-sans font-bold text-on-surface">Danh Mục Hạng Phòng</h2>
                <p className="text-sm text-outline mt-1">Được thiết kế tỉ mỉ theo tiêu chuẩn Quiet Luxury</p>
              </div>
            </div>

            <div className="space-y-6">
              {roomTypes.map((rt) => (
                <div
                  key={rt.id}
                  className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/40 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-primary-container/20 text-primary text-xs font-bold">
                        Tối đa {rt.max_guests} khách
                      </span>
                      <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full">
                        Phòng còn trống
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-on-surface">{rt.name}</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {rt.description || 'Không gian nghỉ ngơi thư thái với ban công khoáng đạt, giường King êm ái và phòng tắm lát đá cẩm thạch.'}
                    </p>

                    {rt.amenities && rt.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {rt.amenities.map((am, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-surface-container text-on-surface font-medium">
                            • {am}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-outline-variant/30 w-full md:w-auto">
                    <div>
                      <span className="text-xs text-outline uppercase font-bold tracking-wider">Giá mỗi đêm</span>
                      <div className="text-2xl font-black text-primary">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rt.base_price)}
                      </div>
                      <span className="text-xs text-tertiary font-medium">Đã bao gồm thuế &amp; phí</span>
                    </div>

                    <button
                      onClick={() => setIsBookingModalOpen(true)}
                      className="h-11 px-6 rounded-full bg-primary text-on-primary font-bold text-sm hover:bg-primary-container hover:text-on-primary-container transition-all cursor-pointer shadow-sm w-full md:w-auto"
                    >
                      Đặt Hạng Phòng Này
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stay Policies */}
          <div className="p-8 rounded-3xl bg-surface-container-low border border-outline-variant/30 space-y-4">
            <h2 className="text-xl font-sans font-bold text-on-surface">Chính Sách &amp; Quy Định Lưu Trú</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-on-surface-variant">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-on-surface">Nhận phòng: Từ 14:00</div>
                  <div className="text-xs text-outline">Trả phòng: Trước 12:00 trưa</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-on-surface">Miễn phí hủy phòng</div>
                  <div className="text-xs text-outline">Hủy trước 48h nhận phòng được hoàn 100%</div>
                </div>
              </div>
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
                <span className="text-sm font-normal text-outline"> / đêm</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface space-y-2">
              <div className="flex items-center gap-2 font-bold text-primary">
                <CheckCircle2 className="w-4 h-4" />
                <span>Cam kết giá tốt nhất độc quyền</span>
              </div>
              <p className="text-on-surface-variant leading-relaxed">
                Tích lũy điểm hội viên Aurum Elite Club và nhận đặc quyền Fast Check-in tự động.
              </p>
            </div>

            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="w-full h-14 rounded-full bg-primary text-on-primary font-bold text-base hover:bg-primary-container hover:text-on-primary-container transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Tiến Hành Đặt Phòng</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <BookingModal
          property={property}
          onClose={() => setIsBookingModalOpen(false)}
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
            <p className="text-sm font-semibold text-outline">Đang kết nối khu nghỉ dưỡng thượng lưu...</p>
          </div>
        </div>
      }
    >
      <PropertyDetailContent />
    </React.Suspense>
  );
}


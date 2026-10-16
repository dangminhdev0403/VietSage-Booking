'use client';

import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Sparkles,
  Calendar,
  Users,
  ArrowRight,
  ShieldCheck,
  Award,
  Crown,
  Compass,
  UtensilsCrossed,
  Ship,
  Sparkle,
} from 'lucide-react';
import { usePropertiesQuery, useServicesQuery } from '@/features/catalog/hooks/use-catalog';
import { Property, PropertyCard } from '@/features/catalog/components/property-card';
import { BookingModal } from '@/features/bookings/components/booking-modal';

export default function HomePage() {
  const [cityFilter, setCityFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const { data: propertiesData, isLoading, isError, refetch } = usePropertiesQuery({
    city: cityFilter || undefined,
    keyword: keyword || undefined,
  });

  const { data: services } = useServicesQuery();

  const handleDestinationSelect = (city: string) => {
    setCityFilter(city);
    const el = document.getElementById('catalog-stream');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-20 pb-24">
      {/* 1. HERO SECTION WITH LUXURIOUS EDITORIAL OVERLAY */}
      <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden bg-slate-950">
        <div className="absolute inset-0 z-0">
          <img
            alt="Panoramic luxury resort villa with infinity pool"
            className="w-full h-full object-cover opacity-65 scale-105 transition-transform duration-1000"
            src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=2000&q=85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-black/45 to-black/75 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/60"></div>
        </div>

        <div className="relative z-10 w-full max-w-[1360px] mx-auto px-6 lg:px-10 py-24 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-surface-container-lowest/85 backdrop-blur-md border border-outline-variant/40 shadow-sm mb-6">
            <Crown className="w-4 h-4 text-primary" />
            <span className="text-xs sm:text-sm uppercase tracking-wider text-primary font-bold">
              Tập hợp Khách sạn & Biệt thự Siêu Cao cấp 2026
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white max-w-5xl tracking-tight leading-[1.18] mb-6 drop-shadow-sm text-balance">
            Khám Phá Bản Giao Hưởng <span className="italic font-light text-primary-fixed-dim">Nghỉ Dưỡng Thượng Lưu</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-100 max-w-3xl leading-relaxed mb-8 drop-shadow text-balance font-normal">
            Bước vào lãnh địa của sự thanh lọc tâm hồn và tiện nghi vương giả không ồn ào. Nơi mỗi nhịp thở hòa cùng thiên nhiên di sản và đặc quyền xa hoa chuẩn mực quốc tế.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-slate-200">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Award className="w-4 h-4 text-primary-fixed-dim" />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">Michelin Key Selected</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-outline-variant"></div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <ShieldCheck className="w-4 h-4 text-primary-fixed-dim" />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">Forbes Travel Guide 5-Star</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-outline-variant"></div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Sparkles className="w-4 h-4 text-primary-fixed-dim" />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">Quản Gia Riêng 24/7</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FLOATING LUXURY BOOKING BAR */}
      <section className="relative z-30 w-full max-w-[1280px] mx-auto px-4 -mt-20 sm:-mt-24">
        <div className="bg-surface-container-lowest/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgba(114,91,56,0.16)] p-5 lg:p-7 border border-outline-variant/40">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              refetch();
              const el = document.getElementById('catalog-stream');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-center"
          >
            {/* Destination Selector */}
            <div className="lg:col-span-4 flex flex-col gap-1.5 p-3.5 bg-surface-container-low rounded-2xl hover:bg-surface-container transition-colors relative cursor-pointer group">
              <div className="flex items-center gap-2 text-primary">
                <Compass className="w-4 h-4" />
                <label className="text-xs uppercase tracking-wider text-primary font-bold cursor-pointer">
                  Điểm đến Tinh hoa
                </label>
              </div>
              <input
                type="text"
                placeholder="Hà Nội, Đà Lạt, Phú Quốc, Đà Nẵng..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="bg-transparent text-base sm:text-lg text-on-surface font-bold focus:outline-none w-full"
              />
              <div className="flex items-center gap-2 text-outline text-xs mt-0.5">
                <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                <span>Tập hợp biệt thự di sản sẵn sàng</span>
              </div>
            </div>

            {/* Keyword / Hotel name */}
            <div className="lg:col-span-3 flex flex-col gap-1.5 p-3.5 bg-surface-container-low rounded-2xl hover:bg-surface-container transition-colors">
              <div className="flex items-center gap-2 text-primary">
                <Search className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider text-primary font-bold">
                  Khách Sạn & Dinh Thự
                </span>
              </div>
              <input
                type="text"
                placeholder="Tìm tên resort, villa..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="bg-transparent text-base sm:text-lg text-on-surface font-bold focus:outline-none w-full"
              />
              <span className="text-xs text-outline">Đồng bộ VietSage PMS</span>
            </div>

            {/* Guests & Suites */}
            <div className="lg:col-span-2 flex flex-col gap-1.5 p-3.5 bg-surface-container-low rounded-2xl hover:bg-surface-container transition-colors">
              <div className="flex items-center gap-2 text-primary">
                <Users className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider text-primary font-bold">
                  Số Khách & Phòng
                </span>
              </div>
              <div className="text-base sm:text-lg text-on-surface font-bold truncate">02 Khách</div>
              <span className="text-xs text-outline truncate">1 Phòng Suite / Villa</span>
            </div>

            {/* Submit Button */}
            <div className="lg:col-span-3 flex items-center">
              <button
                type="submit"
                className="w-full h-16 rounded-2xl bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-all shadow-[0_8px_24px_rgba(114,91,56,0.25)] flex flex-col items-center justify-center group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base tracking-wider uppercase font-extrabold whitespace-nowrap">Tìm Kỳ Nghỉ</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
                <span className="text-xs opacity-90 font-medium">Cam kết Giá Tốt Nhất</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 3. PRESTIGE METRICS */}
      <section className="w-full max-w-[1360px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-surface-container-low rounded-3xl p-8 border border-outline-variant/30 shadow-sm">
          <div className="flex flex-col items-center text-center p-2">
            <span className="text-4xl sm:text-5xl text-primary font-black">128+</span>
            <span className="text-sm sm:text-base font-bold text-on-surface mt-2 whitespace-nowrap">Biệt thự Đảo & Dinh thự</span>
            <span className="text-xs sm:text-sm text-outline mt-0.5">Biệt lập hoàn toàn với thiên nhiên</span>
          </div>
          <div className="flex flex-col items-center text-center p-2">
            <span className="text-4xl sm:text-5xl text-primary font-black">99.4%</span>
            <span className="text-sm sm:text-base font-bold text-on-surface mt-2 whitespace-nowrap">Mức độ Hài lòng VIP</span>
            <span className="text-xs sm:text-sm text-outline mt-0.5">Kiểm chứng bởi Forbes Luxury</span>
          </div>
          <div className="flex flex-col items-center text-center p-2">
            <span className="text-4xl sm:text-5xl text-primary font-black">1:1</span>
            <span className="text-sm sm:text-base font-bold text-on-surface mt-2 whitespace-nowrap">Tỷ lệ Quản gia Riêng</span>
            <span className="text-xs sm:text-sm text-outline mt-0.5">Chăm sóc mọi chi tiết 24/7</span>
          </div>
          <div className="flex flex-col items-center text-center p-2">
            <span className="text-4xl sm:text-5xl text-primary font-black">14</span>
            <span className="text-sm sm:text-base font-bold text-on-surface mt-2 whitespace-nowrap">Nhà hàng Sao Michelin</span>
            <span className="text-xs sm:text-sm text-outline mt-0.5">Hành trình ẩm thực nghệ thuật</span>
          </div>
        </div>
      </section>

      {/* 4. CURATED DESTINATIONS BENTO GRID */}
      <section id="destinations" className="w-full max-w-[1360px] mx-auto px-6 lg:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 text-primary mb-2">
              <Compass className="w-5 h-5" />
              <span className="text-xs sm:text-sm uppercase tracking-wider font-bold">Tọa độ nghỉ dưỡng biểu tượng</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-on-surface">
              Điểm Đến Tinh Hoa Được Tuyển Chọn
            </h2>
          </div>
          <p className="text-sm sm:text-base text-on-surface-variant max-w-md leading-relaxed">
            Mỗi điểm đến của Aurum Haven là một tuyệt tác được lựa chọn khắt khe về cảnh quan thiên nhiên và phong thủy tĩnh tại.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Destination 1: Phu Quoc */}
          <div
            onClick={() => handleDestinationSelect('Phú Quốc')}
            className="md:col-span-7 group relative rounded-3xl overflow-hidden shadow-md min-h-[440px] flex flex-col justify-end p-8 cursor-pointer border border-outline-variant/30"
          >
            <img
              alt="Phu Quoc Sanctuary"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              src="https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&w=1200&q=80"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent"></div>
            <div className="relative z-10 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface text-xs uppercase font-extrabold tracking-wider">
                  Đảo Ngọc Biển Xanh
                </span>
                <span className="px-3.5 py-1 rounded-full bg-primary text-on-primary text-xs uppercase font-extrabold tracking-wider">
                  Bán chạy nhất
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl text-white font-extrabold">Phú Quốc • Serene Haven Reserve</h3>
              <p className="text-sm text-surface-container-high line-clamp-2 leading-relaxed font-normal">
                Vùng vịnh hoàng gia tách biệt với thế giới bên ngoài, nơi mặt trời lặn dát vàng lên hồ bơi nước mặn riêng biệt.
              </p>
              <div className="flex items-center justify-between pt-2">
                <div className="flex flex-col">
                  <span className="text-xs text-surface-dim uppercase font-bold">Giá khởi điểm</span>
                  <span className="text-xl sm:text-2xl text-primary-fixed-dim font-black">
                    14.500.000₫ <span className="text-xs font-normal text-surface-container">/ đêm</span>
                  </span>
                </div>
                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-container-lowest text-on-surface text-sm font-bold group-hover:bg-primary group-hover:text-on-primary transition-colors whitespace-nowrap">
                  Khám phá biệt thự <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>

          {/* Destination 2: Ha Noi & Da Lat */}
          <div className="md:col-span-5 flex flex-col gap-6">
            <div
              onClick={() => handleDestinationSelect('Hà Nội')}
              className="flex-1 group relative rounded-3xl overflow-hidden shadow-md min-h-[205px] flex flex-col justify-end p-6 cursor-pointer border border-outline-variant/30"
            >
              <img
                alt="Ha Noi Heritage"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>
              <div className="relative z-10 flex flex-col gap-1.5">
                <span className="px-3 py-0.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface text-xs uppercase font-extrabold self-start">
                  Thủ Đô Ngàn Năm
                </span>
                <h3 className="text-xl sm:text-2xl text-white font-bold">Hà Nội • Heritage French Mansion</h3>
                <span className="text-sm text-primary-fixed-dim font-extrabold">Từ 3.500.000₫ / đêm</span>
              </div>
            </div>

            <div
              onClick={() => handleDestinationSelect('Đà Lạt')}
              className="flex-1 group relative rounded-3xl overflow-hidden shadow-md min-h-[205px] flex flex-col justify-end p-6 cursor-pointer border border-outline-variant/30"
            >
              <img
                alt="Da Lat Pine Forest"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>
              <div className="relative z-10 flex flex-col gap-1.5">
                <span className="px-3 py-0.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface text-xs uppercase font-extrabold self-start">
                  Rừng Thông Sương Mờ
                </span>
                <h3 className="text-xl sm:text-2xl text-white font-bold">Đà Lạt • Pine Forest Valley Sanctuary</h3>
                <span className="text-sm text-primary-fixed-dim font-extrabold">Từ 2.800.000₫ / đêm</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOTEL RESULTS & CATALOG STREAM */}
      <section id="catalog-stream" className="w-full max-w-[1360px] mx-auto px-6 lg:px-10 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-outline-variant/30 pb-5 mb-8">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1.5">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider font-bold">Bộ sưu tập Khách sạn & Biệt thự</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface">
              Khu Nghỉ Dưỡng Sẵn Sàng Đón Tiếp
            </h2>
          </div>
          <div className="text-sm text-outline font-medium">
            Hiển thị <span className="font-extrabold text-primary">{propertiesData?.items.length || 0}</span> điểm đến được chứng thực
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-3xl bg-surface-container animate-pulse border border-outline-variant/20" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12 bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-8">
            <p className="text-on-surface-variant text-base">Không thể kết nối đến máy chủ OTA.</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-6 py-3 bg-primary text-on-primary rounded-full text-sm font-bold"
            >
              Thử lại
            </button>
          </div>
        ) : propertiesData?.items.length === 0 ? (
          <div className="text-center py-16 bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-8">
            <Compass className="w-12 h-12 text-outline mx-auto mb-2 opacity-50" />
            <p className="text-on-surface text-lg font-bold">Chưa tìm thấy khu nghỉ dưỡng phù hợp.</p>
            <p className="text-outline text-sm mt-1">Quý khách vui lòng thử tìm kiếm với điểm đến hoặc từ khóa khác.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {propertiesData?.items.map((prop) => (
              <PropertyCard
                key={prop.id}
                property={prop}
                onBookNow={(p) => setSelectedProperty(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 6. BESPOKE PRIVILEGES & SERVICES */}
      <section id="services" className="w-full max-w-[1360px] mx-auto px-6 lg:px-10 pt-10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-primary mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs sm:text-sm uppercase tracking-wider font-bold">Đặc Quyền Thượng Hạng</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight max-w-2xl mx-auto text-balance">
            Nghệ Thuật Phục Vụ <span className="whitespace-nowrap">May Đo Riêng</span>
          </h2>

          <p className="text-sm sm:text-base text-on-surface-variant mt-3 leading-relaxed">
            Mỗi giây phút tại Aurum Haven không đơn thuần là một kỳ nghỉ dưỡng, mà là bản giao hưởng trải nghiệm được thiết kế riêng theo từng sở thích của quý khách.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(services || []).map((srv) => (
            <div
              key={srv.id}
              className="p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary-container/20 text-primary flex items-center justify-center mb-4">
                  <Sparkle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-on-surface">{srv.name}</h3>
                <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                  {srv.description || 'Dịch vụ thượng lưu được đồng bộ cùng hệ thống VietSage PMS.'}
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-outline-variant/20 flex items-center justify-between">
                <div>
                  <span className="text-xs text-outline block uppercase font-bold">Giá đặc quyền</span>
                  <span className="text-base font-extrabold text-primary">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(srv.price)}
                  </span>
                </div>
                <span className="text-xs text-tertiary font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-tertiary-container/20">
                  {srv.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Booking Modal */}
      {selectedProperty && (
        <BookingModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </div>
  );
}

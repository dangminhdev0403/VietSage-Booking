'use client';

import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Users,
  ArrowRight,
  ShieldCheck,
  Award,
  Crown,
  Compass,
  Sparkle,
  CheckCircle2,
} from 'lucide-react';
import { usePropertiesQuery, useServicesQuery } from '@/features/catalog/hooks/use-catalog';
import { Property, PropertyCard } from '@/features/catalog/components/property-card';
import { BookingModal } from '@/features/bookings/components/booking-modal';
import { TypingText } from '@/components/ui/typing-text';
import { FadeIn } from '@/components/ui/fade-in';

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
      {/* 1. HERO SECTION WITH LUXURIOUS EDITORIAL OVERLAY & TYPING ANIMATION */}
      <section className="relative w-full min-h-[88vh] flex items-center justify-center overflow-hidden bg-slate-950">
        <div className="absolute inset-0 z-0">
          <img
            alt="Panoramic luxury resort villa with infinity pool"
            className="w-full h-full object-cover opacity-65 scale-105 transition-transform duration-1000"
            src="/images/hero-cover.jpg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-black/45 to-black/75 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/60"></div>
        </div>

        <div className="relative z-10 w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 sm:pt-16 lg:pt-24 pb-20 sm:pb-24 lg:pb-28 flex flex-col items-center text-center">
          <FadeIn direction="down" duration={0.7}>
            <div className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-surface-container-lowest/85 backdrop-blur-md border border-outline-variant/40 shadow-sm mb-5 sm:mb-6">
              <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              <span className="text-[11px] sm:text-sm uppercase tracking-wider text-primary font-extrabold">
                Kênh Đặt Phòng Trực Tuyến VietSageBooking 2026
              </span>
            </div>
          </FadeIn>

          <FadeIn delay={0.15} duration={0.8}>
            <h1 className="text-2xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white max-w-5xl tracking-tight leading-[1.18] mb-5 sm:mb-6 drop-shadow-md">
              <span className="block font-sans text-white/95">
                Khám Phá Bản Giao Hưởng
              </span>
              <span className="block mt-2 sm:mt-3 text-2xl sm:text-5xl md:text-6xl lg:text-7xl font-serif italic font-bold sm:font-extrabold tracking-normal text-primary-fixed drop-shadow-[0_4px_24px_rgba(254,222,178,0.45)] min-h-[1.3em]">
                <TypingText
                  words={[
                    'Nghỉ Dưỡng Thượng Lưu',
                    'Đẳng Cấp Bản Địa',
                    'Biệt Thự Biệt Lập',
                    'Kỳ Nghỉ Tinh Hoa',
                  ]}
                  className="whitespace-nowrap"
                  cursorClassName="bg-primary-fixed shadow-[0_0_12px_rgba(254,222,178,0.9)]"
                />
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.3} duration={0.8}>
            <p className="text-base sm:text-xl text-slate-100 max-w-3xl leading-relaxed mb-8 drop-shadow text-balance font-normal">
              Bước vào lãnh địa của sự thanh lọc tâm hồn và tiện nghi vương giả không ồn ào. Nơi mỗi nhịp thở hòa cùng thiên nhiên di sản và đặc quyền xa hoa chuẩn mực quốc tế.
            </p>
          </FadeIn>

          <FadeIn delay={0.45} duration={0.8}>
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
                <CheckCircle2 className="w-4 h-4 text-primary-fixed-dim" />
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">Xác Nhận Đặt Chỗ Tức Thì</span>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 2. REFINED LUXURY BOOKING BAR (Sleek unified pill, không phình box) */}
      <section className="relative z-30 w-full max-w-[1140px] mx-auto px-4 -mt-10 sm:-mt-12 lg:-mt-14">
        <FadeIn direction="up" delay={0.2} duration={0.6}>
          <div className="bg-surface-container-lowest/95 backdrop-blur-xl rounded-2xl lg:rounded-full shadow-[0_12px_36px_rgba(40,30,15,0.08)] border border-outline-variant/35 p-2.5 lg:p-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                refetch();
                const el = document.getElementById('catalog-stream');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-0"
            >
              {/* Destination Selector */}
              <div className="flex-1 px-4 sm:px-5 py-2 hover:bg-surface-container-low/60 rounded-xl lg:rounded-full transition-colors cursor-pointer group">
                <div className="flex items-center gap-1.5 text-primary">
                  <Compass className="w-3.5 h-3.5 text-primary" />
                  <label className="text-[10px] sm:text-[11px] uppercase tracking-wider text-primary font-extrabold cursor-pointer">
                    Điểm Đến Tinh Hoa
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Hà Nội, Phú Quốc, Đà Lạt..."
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="bg-transparent text-sm sm:text-base text-on-surface font-bold focus:outline-none w-full placeholder:text-outline/50 placeholder:font-normal mt-0.5"
                />
              </div>

              {/* Subtle Divider */}
              <div className="hidden lg:block w-px h-9 bg-outline-variant/30 shrink-0 mx-1" />

              {/* Keyword / Hotel name */}
              <div className="flex-1 px-4 sm:px-5 py-2 hover:bg-surface-container-low/60 rounded-xl lg:rounded-full transition-colors group">
                <div className="flex items-center gap-1.5 text-primary">
                  <Search className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-primary font-extrabold">
                    Khách Sạn & Resort
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Tìm resort, biệt thự nghỉ dưỡng..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="bg-transparent text-sm sm:text-base text-on-surface font-bold focus:outline-none w-full placeholder:text-outline/50 placeholder:font-normal mt-0.5"
                />
              </div>

              {/* Subtle Divider */}
              <div className="hidden lg:block w-px h-9 bg-outline-variant/30 shrink-0 mx-1" />

              {/* Guests & Suites */}
              <div className="w-full lg:w-48 px-4 sm:px-5 py-2 hover:bg-surface-container-low/60 rounded-xl lg:rounded-full transition-colors shrink-0">
                <div className="flex items-center gap-1.5 text-primary">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-primary font-extrabold">
                    Khách & Phòng
                  </span>
                </div>
                <div className="text-sm sm:text-base text-on-surface font-bold mt-0.5 truncate">
                  02 Khách • 1 Villa
                </div>
              </div>

              {/* Submit Button */}
              <div className="p-1 lg:pl-2 shrink-0">
                <button
                  type="submit"
                  className="w-full lg:w-auto h-12 lg:h-13 px-6 lg:px-8 rounded-xl lg:rounded-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-all shadow-sm flex items-center justify-center gap-2 group cursor-pointer active:scale-95"
                >
                  <span className="text-xs sm:text-sm tracking-wider uppercase font-extrabold whitespace-nowrap">
                    Tìm Kỳ Nghỉ
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </form>
          </div>
        </FadeIn>
      </section>

      {/* 4. CURATED DESTINATIONS BENTO GRID */}
      <section id="destinations" className="w-full max-w-[1360px] mx-auto px-6 lg:px-10">
        <FadeIn delay={0.1}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 text-primary mb-2">
                <Compass className="w-5 h-5" />
                <span className="text-xs sm:text-sm uppercase tracking-wider font-bold">Tọa độ nghỉ dưỡng biểu tượng</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-on-surface tracking-tight">
                Điểm Đến Tinh Hoa <span className="whitespace-nowrap">Được Tuyển Chọn</span>
              </h2>
            </div>
            <p className="text-sm sm:text-base text-on-surface-variant max-w-md leading-relaxed">
              Mỗi điểm đến của VietSageBooking là một tuyệt tác được lựa chọn khắt khe về cảnh quan thiên nhiên và dịch vụ cao cấp.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Destination 1: Phu Quoc */}
          <FadeIn direction="left" delay={0.15} className="md:col-span-7">
            <div
              onClick={() => handleDestinationSelect('Phú Quốc')}
              className="group relative rounded-3xl overflow-hidden shadow-md min-h-[440px] flex flex-col justify-end p-8 cursor-pointer border border-outline-variant/30 h-full"
            >
              <img
                alt="Phu Quoc Sanctuary"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                src="/images/dest-phuquoc.jpg"
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
          </FadeIn>

          {/* Destination 2: Ha Noi & Da Lat */}
          <div className="md:col-span-5 flex flex-col gap-6">
            <FadeIn direction="right" delay={0.2} className="flex-1">
              <div
                onClick={() => handleDestinationSelect('Hà Nội')}
                className="group relative rounded-3xl overflow-hidden shadow-md min-h-[205px] flex flex-col justify-end p-6 cursor-pointer border border-outline-variant/30 h-full"
              >
                <img
                  alt="Ha Noi Heritage"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  src="/images/dest-hanoi.jpg"
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
            </FadeIn>

            <FadeIn direction="right" delay={0.3} className="flex-1">
              <div
                onClick={() => handleDestinationSelect('Đà Lạt')}
                className="group relative rounded-3xl overflow-hidden shadow-md min-h-[205px] flex flex-col justify-end p-6 cursor-pointer border border-outline-variant/30 h-full"
              >
                <img
                  alt="Da Lat Pine Forest"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  src="/images/dest-dalat.jpg"
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
            </FadeIn>
          </div>
        </div>
      </section>

      {/* 5. HOTEL RESULTS & CATALOG STREAM */}
      <section id="catalog-stream" className="w-full max-w-[1360px] mx-auto px-6 lg:px-10 pt-6">
        <FadeIn delay={0.1}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-outline-variant/30 pb-5 mb-8">
            <div>
              <div className="flex items-center gap-2 text-primary mb-1.5">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider font-bold">Bộ sưu tập Khách sạn & Biệt thự</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
                Khu Nghỉ Dưỡng Sẵn Sàng Đón Tiếp
              </h2>
            </div>
            <div className="text-sm text-outline font-medium">
              Hiển thị <span className="font-extrabold text-primary">{propertiesData?.items.length || 0}</span> điểm đến được chứng thực
            </div>
          </div>
        </FadeIn>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-3xl bg-surface-container animate-pulse border border-outline-variant/20" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12 bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-8">
            <p className="text-on-surface-variant text-base">Không thể kết nối đến máy chủ VietSageBooking.</p>
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
            {propertiesData?.items.map((prop, idx) => (
              <FadeIn key={prop.id} delay={idx * 0.1} duration={0.6}>
                <PropertyCard
                  property={prop}
                  onBookNow={(p) => setSelectedProperty(p)}
                />
              </FadeIn>
            ))}
          </div>
        )}
      </section>

      {/* 6. BESPOKE PRIVILEGES & SERVICES */}
      <section id="services" className="w-full max-w-[1360px] mx-auto px-6 lg:px-10 pt-10">
        <FadeIn delay={0.1}>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 text-primary mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs sm:text-sm uppercase tracking-wider font-bold">Đặc Quyền Thượng Hạng</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight max-w-3xl mx-auto">
              <span className="whitespace-nowrap">Nghệ Thuật Phục Vụ</span> <span className="whitespace-nowrap">May Đo Riêng</span>
            </h2>
            <p className="text-sm sm:text-base text-on-surface-variant mt-3 leading-relaxed text-balance">
              Mỗi giây phút tại VietSageBooking không đơn thuần là một kỳ nghỉ dưỡng, mà là bản giao hưởng trải nghiệm được thiết kế riêng theo từng sở thích của quý khách.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(services || []).map((srv, idx) => (
            <FadeIn key={srv.id} delay={idx * 0.08} duration={0.5}>
              <div
                className="p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 hover:shadow-lg transition-all flex flex-col justify-between h-full"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-primary-container/20 text-primary flex items-center justify-center mb-4">
                    <Sparkle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-on-surface">{srv.name}</h3>
                  <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                    {srv.description || 'Đặc quyền nghỉ dưỡng tiêu chuẩn 5 sao được sắp xếp chu đáo.'}
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
            </FadeIn>
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

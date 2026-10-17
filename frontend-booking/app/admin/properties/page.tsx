'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  Search,
  MapPin,
  Star,
  CalendarDays,
  ExternalLink,
  BedDouble,
  Users,
  Sparkles,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { usePropertiesQuery } from '@/features/catalog/hooks/use-catalog';

export default function AdminPropertiesPage() {
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  const { data: propertiesData, isLoading, error, refetch } = usePropertiesQuery();
  const properties = propertiesData?.items || [];

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
          <div className="flex items-center gap-1.5 text-outline text-[11px] font-bold uppercase tracking-widest">
            <span>OTA Management</span>
            <ChevronRight className="w-3.5 h-3.5 text-outline-variant" />
            <span className="text-primary font-extrabold">Properties &amp; Room Catalog</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface tracking-tight">
            Danh Mục Khách Sạn &amp; Resort
          </h1>

          <p className="text-xs sm:text-base text-on-surface-variant max-w-2xl leading-relaxed">
            Quản lý danh sách cơ sở lưu trú, các phân hạng phòng và chính sách giá phân phối trên hệ thống VietSageBooking OTA.
          </p>
        </div>

        {/* Action Cluster */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/30 hover:bg-surface-container text-on-surface rounded-2xl transition-all shadow-2xs text-xs font-bold cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-primary" />
            <span>Làm Mới Danh Mục</span>
          </button>

          <Link
            href="/admin/allotments"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-on-primary rounded-2xl transition-all shadow-xs text-xs font-bold cursor-pointer"
          >
            <CalendarDays className="w-4 h-4" />
            <span>Lịch Tồn Kho &amp; Giá Bán</span>
          </Link>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-2xs">
          <div className="flex items-center justify-between text-outline text-[10px] uppercase font-bold tracking-wider mb-2">
            <span>Tổng Khách Sạn / Resort</span>
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-on-surface">{properties.length}</div>
          <div className="text-[11px] text-tertiary font-medium mt-1">Đang phân phối trên OTA</div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-2xs">
          <div className="flex items-center justify-between text-outline text-[10px] uppercase font-bold tracking-wider mb-2">
            <span>Tổng Hạng Phòng</span>
            <BedDouble className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-on-surface">{totalRoomTypes}</div>
          <div className="text-[11px] text-outline font-medium mt-1">Hạng phòng khả dụng</div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-2xs">
          <div className="flex items-center justify-between text-outline text-[10px] uppercase font-bold tracking-wider mb-2">
            <span>Địa Điểm Phủ Sóng</span>
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-on-surface">{cities.length || 1}</div>
          <div className="text-[11px] text-outline font-medium mt-1">Thành phố trọng điểm</div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-2xs">
          <div className="flex items-center justify-between text-outline text-[10px] uppercase font-bold tracking-wider mb-2">
            <span>Giá Khởi Điểm Từ</span>
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-on-surface">
            {minPrice > 0
              ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(minPrice)
              : '—'}
          </div>
          <div className="text-[11px] text-primary font-medium mt-1">Giá tốt nhất trên hệ thống</div>
        </div>
      </div>

      {/* 3. FILTER & SEARCH BAR */}
      <div className="bg-surface-container-lowest rounded-3xl p-4 sm:p-5 border border-outline-variant/30 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* City Filter Pills */}
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
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold">
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
                        href={`/properties/${prop.id}`}
                        target="_blank"
                        className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-primary" />
                        <span>Xem Trên OTA</span>
                      </Link>

                      <Link
                        href={`/admin/allotments?property_id=${prop.id}`}
                        className="px-3.5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:bg-primary/90 transition-colors"
                      >
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span>Quản Lý Quỹ Phòng</span>
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
                    <span className="text-[11px] uppercase tracking-wider font-extrabold text-outline">
                      Các Hạng Phòng Phân Phối ({prop.room_types?.length || 0})
                    </span>
                    <span className="text-xs text-tertiary font-semibold">
                      Đã đồng bộ với PMS
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
                            <div className="flex items-center gap-2 text-[11px] text-outline mt-0.5">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>Tối đa {rt.max_guests} khách</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-baseline justify-between pt-1 border-t border-outline-variant/10">
                            <span className="text-[10px] text-outline font-medium">Giá tiêu chuẩn</span>
                            <span className="text-xs font-black text-primary">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rt.base_price)}
                              <span className="text-[10px] font-normal text-outline">/đêm</span>
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
    </div>
  );
}

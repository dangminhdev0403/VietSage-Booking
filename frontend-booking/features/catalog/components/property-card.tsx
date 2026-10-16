'use client';

import React from 'react';
import { Star, MapPin, Sparkles, BedDouble, ShieldCheck, Heart } from 'lucide-react';

export type Property = {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string;
  description?: string | null;
  star_rating: number;
  thumbnail_url?: string | null;
  room_types?: {
    id: string;
    name: string;
    max_guests: number;
    base_price: number;
    description?: string;
  }[];
  created_at: string;
};

export function PropertyCard({
  property,
  onBookNow,
}: {
  property: Property;
  onBookNow: (property: Property) => void;
}) {
  const roomTypes = property.room_types || [];
  const lowestPrice = roomTypes.length > 0
    ? Math.min(...roomTypes.map((r) => r.base_price))
    : 14500000;

  return (
    <article className="group bg-surface-container-lowest rounded-2xl shadow-sm hover:shadow-[0_12px_32px_-4px_rgba(15,23,42,0.08),0_4px_12px_-2px_rgba(197,168,128,0.12)] transition-all duration-500 overflow-hidden flex flex-col border border-outline-variant/30">
      {/* Thumbnail Section */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-container">
        <img
          src={property.thumbnail_url || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'}
          alt={property.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        
        {/* Badges on image */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
          <span className="px-2.5 py-0.5 rounded-full bg-surface-bright/95 backdrop-blur-md text-on-surface text-[10px] uppercase font-bold tracking-wider shadow-sm">
            Boutique Collection
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-primary text-on-primary text-[10px] uppercase tracking-wider font-semibold shadow-sm">
            {property.city}
          </span>
        </div>

        {/* Wishlist Heart */}
        <button
          aria-label="Lưu vào danh sách yêu thích"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface-bright/80 backdrop-blur-md flex items-center justify-center text-on-surface hover:text-rose-600 transition-colors shadow"
          type="button"
        >
          <Heart className="w-4 h-4" />
        </button>
      </div>

      {/* Details Section */}
      <div className="p-6 flex flex-col justify-between flex-1">
        <div className="flex flex-col gap-2.5">
          {/* Star & Rating Tier */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-primary">
              {Array.from({ length: Math.min(5, Math.floor(property.star_rating || 5)) }).map((_, idx) => (
                <Star key={idx} className="w-3.5 h-3.5 fill-primary text-primary" />
              ))}
              <span className="text-xs font-semibold text-on-surface ml-1">
                {property.star_rating >= 5 ? '5 Sao Luxury' : `${property.star_rating} Sao`}
              </span>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-container/20 text-on-primary-container text-xs font-bold">
              9.9 / 10 Tuyệt đỉnh
            </div>
          </div>

          {/* Title */}
          <h2 className="font-serif text-xl font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
            {property.name}
          </h2>

          {/* Location */}
          <p className="text-xs text-outline flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{property.address}, {property.city}</span>
          </p>

          {/* Description */}
          <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
            {property.description || 'Khu biệt thự nghỉ dưỡng cao cấp hòa quyện thiên nhiên thanh khiết, sở hữu quản gia riêng 24/7 và ẩm thực thượng lưu.'}
          </p>

          {/* Amenities chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] px-2.5 py-1 rounded bg-surface-container text-on-surface font-medium">
              Bãi biển riêng
            </span>
            <span className="text-[11px] px-2.5 py-1 rounded bg-surface-container text-on-surface font-medium">
              Hồ bơi riêng
            </span>
            <span className="text-[11px] px-2.5 py-1 rounded bg-surface-container text-on-surface font-medium">
              Quản gia 24/7
            </span>
            {roomTypes.length > 0 && (
              <span className="text-[11px] px-2.5 py-1 rounded bg-primary-container/15 text-primary font-medium flex items-center gap-1">
                <BedDouble className="w-3 h-3" />
                {roomTypes.length} hạng phòng
              </span>
            )}
          </div>
        </div>

        {/* Price & Action Bottom */}
        <div className="flex items-end justify-between pt-4 mt-4 border-t border-outline-variant/30">
          <div className="flex flex-col">
            <span className="text-[10px] text-outline uppercase font-semibold">Giá mỗi đêm</span>
            <div className="font-serif text-xl text-primary font-bold">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(lowestPrice)}
            </div>
            <span className="text-[10px] text-tertiary font-medium">Miễn phí hủy trước 48h</span>
          </div>

          <button
            onClick={() => onBookNow(property)}
            className="h-10 px-5 rounded-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-all text-xs font-semibold shadow-sm tracking-wide"
            type="button"
          >
            Đặt Phòng Ngay
          </button>
        </div>
      </div>
    </article>
  );
}

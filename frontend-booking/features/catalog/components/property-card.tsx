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
    <article className="group bg-surface-container-lowest rounded-3xl shadow-sm hover:shadow-[0_16px_36px_-4px_rgba(15,23,42,0.1),0_6px_16px_-2px_rgba(197,168,128,0.14)] transition-all duration-500 overflow-hidden flex flex-col border border-outline-variant/30">
      {/* Thumbnail Section */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-container">
        <img
          src={property.thumbnail_url || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'}
          alt={property.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        
        {/* Badges on image */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
          <span className="px-3.5 py-1 rounded-full bg-surface-bright/95 backdrop-blur-md text-on-surface text-xs uppercase font-extrabold tracking-wider shadow-sm">
            Boutique Collection
          </span>
          <span className="px-3.5 py-1 rounded-full bg-primary text-on-primary text-xs uppercase tracking-wider font-bold shadow-sm">
            {property.city}
          </span>
        </div>

        {/* Wishlist Heart */}
        <button
          aria-label="Lưu vào danh sách yêu thích"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-bright/85 backdrop-blur-md flex items-center justify-center text-on-surface hover:text-rose-600 transition-colors shadow"
          type="button"
        >
          <Heart className="w-5 h-5" />
        </button>
      </div>

      {/* Details Section */}
      <div className="p-7 flex flex-col justify-between flex-1">
        <div className="flex flex-col gap-3">
          {/* Star & Rating Tier */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-primary">
              {Array.from({ length: Math.min(5, Math.floor(property.star_rating || 5)) }).map((_, idx) => (
                <Star key={idx} className="w-4 h-4 fill-primary text-primary" />
              ))}
              <span className="text-sm font-bold text-on-surface ml-1">
                {property.star_rating >= 5 ? '5 Sao Luxury' : `${property.star_rating} Sao`}
              </span>
            </div>
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-container/25 text-on-primary-container text-xs font-extrabold">
              9.9 / 10 Tuyệt đỉnh
            </div>
          </div>

          {/* Title - allow 2 lines so full name displays with zero awkward ellipsis */}
          <h2 className="text-xl font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2 min-h-[56px] leading-snug">
            {property.name}
          </h2>


          {/* Location */}
          <p className="text-sm text-outline flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">{property.address}, {property.city}</span>
          </p>

          {/* Description */}
          <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed">
            {property.description || 'Khu biệt thự nghỉ dưỡng cao cấp hòa quyện thiên nhiên thanh khiết, sở hữu quản gia riêng 24/7 và ẩm thực thượng lưu.'}
          </p>

          {/* Amenities chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-xs px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-semibold">
              Bãi biển riêng
            </span>
            <span className="text-xs px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-semibold">
              Hồ bơi riêng
            </span>
            <span className="text-xs px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-semibold">
              Quản gia 24/7
            </span>
            {roomTypes.length > 0 && (
              <span className="text-xs px-3 py-1.5 rounded-lg bg-primary-container/20 text-primary font-bold flex items-center gap-1">
                <BedDouble className="w-3.5 h-3.5" />
                {roomTypes.length} hạng phòng
              </span>
            )}
          </div>
        </div>

        {/* Price & Action Bottom */}
        <div className="flex items-end justify-between pt-5 mt-5 border-t border-outline-variant/30">
          <div className="flex flex-col">
            <span className="text-xs text-outline uppercase font-bold tracking-wider">Giá mỗi đêm</span>
            <div className="text-2xl font-black text-primary tracking-tight">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(lowestPrice)}
            </div>
            <span className="text-xs text-tertiary font-semibold mt-0.5">Miễn phí hủy trước 48h</span>
          </div>

          <button
            onClick={() => onBookNow(property)}
            className="h-12 px-6 rounded-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-all text-sm font-bold shadow-sm whitespace-nowrap cursor-pointer"
            type="button"
          >
            Đặt Phòng Ngay
          </button>
        </div>
      </div>
    </article>
  );
}

import Link from 'next/link';
import { Heart, Star, MapPin, BedDouble, Building2 } from 'lucide-react';
export type AllotmentInfo = {
  date: string;
  total_rooms: number;
  booked_rooms: number;
  available_rooms: number;
  price: number;
  is_blocked: boolean;
};

export type Property = {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string;
  description?: string | null;
  star_rating: number;
  thumbnail_url?: string | null;
  images?: string[];
  room_types?: {
    id: string;
    name: string;
    max_guests: number;
    base_price: number;
    description?: string | null;
    amenities?: string[];
    area_sqm?: number | null;
    bed_count?: number | null;
    bed_type?: string | null;
    has_sea_view?: boolean | null;
    room_images?: string[];
    allotments?: AllotmentInfo[];
  }[];
  created_at?: string;
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

  const thumbnail =
    property.thumbnail_url ||
    (property.images && property.images.length > 0 ? property.images[0] : null);

  return (
    <article className="group bg-surface-container-lowest rounded-3xl shadow-sm hover:shadow-[0_16px_36px_-4px_rgba(15,23,42,0.1),0_6px_16px_-2px_rgba(197,168,128,0.14)] transition-all duration-500 overflow-hidden flex flex-col border border-outline-variant/30">
      {/* Thumbnail Section */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-container">
        <Link href={`/properties/${property.id}`} className="block w-full h-full">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={property.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#10221c] via-[#1a382f] to-[#254d42] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden group-hover:scale-105 transition-transform duration-700 ease-out">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(197,168,128,0.15),transparent_70%)] pointer-events-none" />
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-2.5 shadow-sm">
                <Building2 className="w-6 h-6 text-[#d4af37]" />
              </div>
              <span className="text-white font-bold text-sm line-clamp-1 max-w-[90%] text-balance">
                {property.name}
              </span>
              <span className="mt-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-[#d4af37] border border-[#d4af37]/30 text-xs font-semibold whitespace-nowrap">
                Khu nghỉ dưỡng xác thực • Sẵn sàng đón tiếp
              </span>
            </div>
          )}
        </Link>
        
        {/* Badges on image */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start pointer-events-none">
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
          {/* Star Rating */}
          <div className="flex items-center gap-1.5 text-primary">
            {Array.from({ length: Math.min(5, Math.floor(property.star_rating || 5)) }).map((_, idx) => (
              <Star key={idx} className="w-4 h-4 fill-primary text-primary" />
            ))}
            <span className="text-base font-bold text-on-surface ml-1">
              {property.star_rating >= 5 ? '5 Sao Luxury' : `${property.star_rating} Sao`}
            </span>
          </div>

          {/* Title - clickable to detail page */}
          <Link href={`/properties/${property.id}`} className="hover:text-primary transition-colors">
            <h2 className="text-xl font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2 min-h-[56px] leading-snug">
              {property.name}
            </h2>
          </Link>


          {/* Location */}
          <p className="text-base text-outline flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">{property.address}, {property.city}</span>
          </p>

          {/* Amenities & Highlights chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-xs px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-semibold whitespace-nowrap">
              Xác nhận tức thì
            </span>
            <span className="text-xs px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-semibold whitespace-nowrap">
              Cam kết giá tốt
            </span>
            {roomTypes.length > 0 && (
              <span className="text-xs px-3 py-1.5 rounded-lg bg-primary-container/20 text-primary font-bold flex items-center gap-1 whitespace-nowrap">
                <BedDouble className="w-3.5 h-3.5" />
                {roomTypes.length} hạng phòng
              </span>
            )}
          </div>
        </div>

        {/* Price & Action Bottom */}
        <div className="flex items-end justify-between pt-5 mt-5 border-t border-outline-variant/30">
          <div className="flex flex-col">
            <span className="text-xs text-outline uppercase font-bold tracking-wider">Giá chỉ từ</span>
            <div className="text-2xl font-black text-primary tracking-tight whitespace-nowrap">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(lowestPrice)}
              <span className="text-xs font-normal text-outline"> / đêm</span>
            </div>
          </div>

          <button
            onClick={() => onBookNow(property)}
            className="h-11 px-6 rounded-full bg-primary text-on-primary hover:bg-[#684f2c] transition-all text-sm font-bold shadow-xs whitespace-nowrap cursor-pointer active:scale-95"
            type="button"
          >
            Đặt Phòng Ngay
          </button>
        </div>
      </div>
    </article>
  );
}

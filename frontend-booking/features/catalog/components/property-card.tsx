import Link from 'next/link';
import { Heart, Star, MapPin, BedDouble } from 'lucide-react';
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

  return (
    <article className="group bg-surface-container-lowest rounded-3xl shadow-sm hover:shadow-[0_16px_36px_-4px_rgba(15,23,42,0.1),0_6px_16px_-2px_rgba(197,168,128,0.14)] transition-all duration-500 overflow-hidden flex flex-col border border-outline-variant/30">
      {/* Thumbnail Section */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-container">
        <Link href={`/properties/${property.id}`} className="block w-full h-full">
          <img
            src={property.thumbnail_url || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'}
            alt={property.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
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
            <span className="text-xs px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-semibold">
              Xác nhận tức thì
            </span>
            <span className="text-xs px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-semibold">
              Cam kết giá tốt
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
          </div>

          <button
            onClick={() => onBookNow(property)}
            className="h-12 px-6 rounded-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-all text-base font-bold shadow-sm whitespace-nowrap cursor-pointer"
            type="button"
          >
            Đặt Phòng Ngay
          </button>
        </div>
      </div>
    </article>
  );
}

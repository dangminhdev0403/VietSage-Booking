'use client';

import React, { useState } from 'react';
import { X, Calendar, User, Mail, Phone, Sparkles, CheckCircle2, ShieldCheck, BedDouble } from 'lucide-react';
import { useCreateBookingMutation } from '../hooks/use-bookings';
import { useServicesQuery } from '@/features/catalog/hooks/use-catalog';
import { Property } from '@/features/catalog/components/property-card';

export function BookingModal({
  property,
  onClose,
}: {
  property: Property;
  onClose: () => void;
}) {
  const roomTypes = property.room_types || [];
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [checkIn, setCheckIn] = useState('2026-11-01');
  const [checkOut, setCheckOut] = useState('2026-11-03');
  const [selectedRoomId, setSelectedRoomId] = useState(roomTypes[0]?.id || '');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [specialRequests, setSpecialRequests] = useState('');
  const [confirmedBookingCode, setConfirmedBookingCode] = useState<string | null>(null);

  const { data: services } = useServicesQuery();
  const createMutation = useCreateBookingMutation();

  const selectedRoom = roomTypes.find((r) => r.id === selectedRoomId) || roomTypes[0];
  const roomPrice = selectedRoom?.base_price || 14500000;

  // Nights calculation
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  const nights = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)));

  const servicesPrice = (services || [])
    .filter((s) => selectedServiceIds.includes(s.id))
    .reduce((sum, s) => sum + s.price, 0);

  const totalPrice = roomPrice * nights + servicesPrice;

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createMutation.mutateAsync({
        property_id: property.id,
        room_type_id: selectedRoomId || undefined,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        check_in: checkIn,
        check_out: checkOut,
        total_price: totalPrice,
        special_requests: specialRequests,
        service_ids: selectedServiceIds,
      });
      setConfirmedBookingCode(res.booking_code);
    } catch (err: any) {
      alert(err.message || 'Đặt phòng thất bại, vui lòng kiểm tra lại');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-container-lowest rounded-3xl max-w-2xl w-full p-7 sm:p-9 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.25)] border border-outline-variant/30 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {confirmedBookingCode ? (
          <div className="text-center py-6 space-y-5">
            <div className="w-20 h-20 rounded-full bg-primary-container/30 text-primary flex items-center justify-center mx-auto ring-8 ring-primary-container/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-primary font-bold">Xác nhận Thượng Hạng</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-on-surface mt-1.5">
                Kỳ Nghỉ Của Quý Khách Đã Được Giữ Chỗ
              </h3>
            </div>
            
            <p className="text-on-surface-variant text-sm max-w-md mx-auto leading-relaxed">
              Mã hồ sơ đặt phòng chính thức của quý khách:
            </p>
            <div className="p-4 px-6 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-primary font-mono text-2xl font-black tracking-wider inline-block shadow-sm">
              {confirmedBookingCode}
            </div>

            <div className="p-5 rounded-2xl bg-surface-container text-left text-sm space-y-2.5 border border-outline-variant/20">
              <div className="flex justify-between">
                <span className="text-outline">Khu nghỉ dưỡng:</span>
                <span className="font-bold text-on-surface">{property.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Hạng phòng:</span>
                <span className="font-bold text-on-surface">{selectedRoom?.name || 'Tiêu chuẩn'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Thời gian:</span>
                <span className="font-bold text-on-surface">{checkIn} → {checkOut} ({nights} đêm)</span>
              </div>
              <div className="flex justify-between border-t border-outline-variant/30 pt-2 mt-2">
                <span className="text-outline font-semibold">Tổng chi phí:</span>
                <span className="font-black text-lg text-primary">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}
                </span>
              </div>
            </div>

            <p className="text-xs text-outline leading-relaxed">
              Thông tin chi tiết đã được gửi tới <strong>{guestEmail}</strong> và tự động đồng bộ thời gian thực sang cơ sở dữ liệu VietSage PMS của resort.
            </p>

            <button
              onClick={onClose}
              className="mt-4 w-full py-4 rounded-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container font-bold text-sm uppercase tracking-wider transition-all shadow-sm"
            >
              Hoàn tất & Tiếp tục Khám phá
            </button>
          </div>
        ) : (
          <form onSubmit={handleBookingSubmit} className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-primary mb-1">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs uppercase tracking-widest font-bold">Đặt phòng Trực tiếp</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface leading-snug">
                {property.name}
              </h2>
              <p className="text-sm text-outline mt-1">{property.address}, {property.city}</p>
            </div>

            {/* Room Selector */}
            {roomTypes.length > 0 && (
              <div className="space-y-2.5">
                <label className="text-xs uppercase tracking-wider font-bold text-primary block">
                  Chọn Hạng Phòng / Biệt Thự
                </label>
                <div className="grid grid-cols-1 gap-2.5 max-h-44 overflow-y-auto pr-1">
                  {roomTypes.map((room) => (
                    <label
                      key={room.id}
                      onClick={() => setSelectedRoomId(room.id)}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        selectedRoomId === room.id
                          ? 'border-primary bg-primary-container/20 ring-1 ring-primary'
                          : 'border-outline-variant/30 bg-surface-container-low hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="room_type"
                          checked={selectedRoomId === room.id}
                          onChange={() => setSelectedRoomId(room.id)}
                          className="w-4 h-4 text-primary accent-primary"
                        />
                        <div>
                          <div className="text-sm font-bold text-on-surface">{room.name}</div>
                          <div className="text-xs text-outline">Tối đa {room.max_guests} khách • Quản gia 24/7</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-primary">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(room.base_price)}
                        </span>
                        <span className="text-xs text-outline block font-medium">/ đêm</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-bold text-primary block">
                  Nhận phòng
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 text-sm font-bold rounded-2xl bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-bold text-primary block">
                  Trả phòng
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 text-sm font-bold rounded-2xl bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Guest Details */}
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-bold text-primary block">
                  Họ & Tên Quý khách
                </label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 text-sm rounded-2xl bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-bold text-primary block">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="guest@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-sm rounded-2xl bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-bold text-primary block">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    placeholder="0912 345 678"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-sm rounded-2xl bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Add-on Services */}
            {services && services.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-bold text-primary block">
                  Đặc Quyền & Dịch Vụ Đi Kèm (Tùy chọn)
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {services.map((srv) => (
                    <label
                      key={srv.id}
                      className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                        selectedServiceIds.includes(srv.id)
                          ? 'border-primary bg-primary-container/20 ring-1 ring-primary'
                          : 'border-outline-variant/30 bg-surface-container-low hover:bg-surface-container'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedServiceIds.includes(srv.id)}
                        onChange={() => toggleService(srv.id)}
                        className="w-4 h-4 text-primary accent-primary"
                      />
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-on-surface truncate">{srv.name}</div>
                        <div className="text-xs text-primary font-black">
                          +{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(srv.price)}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Total Bar & Submit */}
            <div className="pt-5 border-t border-outline-variant/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-outline uppercase font-bold tracking-wider">Tổng chi phí ({nights} đêm)</span>
                <div className="text-2xl sm:text-3xl font-black text-primary">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}
                </div>
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="h-14 px-8 rounded-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-all text-sm font-extrabold uppercase tracking-wider shadow-[0_8px_24px_rgba(114,91,56,0.25)] disabled:opacity-50 cursor-pointer"
              >
                {createMutation.isPending ? 'Đang xác nhận...' : 'Xác Nhận Đặt Chỗ'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Edit3,
  X,
  Save,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  listProperties,
  getPropertyAllotments,
  updateAllotment,
  type AllotmentDay,
  type RoomTypeAllotment,
  type PropertyAllotmentResponse,
} from '@/features/catalog/service/catalog.client';

type PropertyOption = {
  id: string;
  name: string;
  city: string;
};

export default function AdminAllotmentsPage() {
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [allotmentData, setAllotmentData] = useState<PropertyAllotmentResponse | null>(null);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Drawer Modal state
  const [editingDay, setEditingDay] = useState<AllotmentDay | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editTotalRooms, setEditTotalRooms] = useState<number>(10);
  const [editIsBlocked, setEditIsBlocked] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);

  // Load properties list
  useEffect(() => {
    listProperties({ pageSize: 50 })
      .then((data) => {
        setProperties(data.items || []);
        if (data.items && data.items.length > 0) {
          setSelectedPropertyId(data.items[0].id);
        }
      })
      .catch((err) => setError(err.message || 'Không thể tải danh sách khách sạn'));
  }, []);

  // Load allotments when property or month changes
  useEffect(() => {
    if (!selectedPropertyId) return;
    let ignore = false;
    getPropertyAllotments(selectedPropertyId, selectedMonth)
      .then((data) => {
        if (!ignore) {
          setAllotmentData(data);
          if (data.room_types && data.room_types.length > 0) {
            setSelectedRoomTypeId((prev) => prev || data.room_types[0].id);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Không thể tải dữ liệu allotment');
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [selectedPropertyId, selectedMonth]);

  const activeRoomType: RoomTypeAllotment | undefined =
    allotmentData?.room_types?.find((rt) => rt.id === selectedRoomTypeId) ||
    allotmentData?.room_types?.[0];

  // Calculate KPIs
  const allDays: AllotmentDay[] = activeRoomType?.allotments || [];
  const totalBooked = allDays.reduce((sum, d) => sum + d.booked_rooms, 0);
  const totalCapacity = allDays.reduce((sum, d) => sum + d.total_rooms, 0);
  const occupancyRate = totalCapacity > 0 ? ((totalBooked / totalCapacity) * 100).toFixed(1) : '0.0';
  const avgRate = allDays.length > 0
    ? Math.round(allDays.reduce((sum, d) => sum + d.price, 0) / allDays.length)
    : activeRoomType?.base_price || 0;
  const blockedDaysCount = allDays.filter((d) => d.is_blocked).length;

  const handleEditClick = (day: AllotmentDay) => {
    setEditingDay(day);
    setEditPrice(day.price);
    setEditTotalRooms(day.total_rooms);
    setEditIsBlocked(day.is_blocked);
  };

  const handleSaveAllotment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDay || !selectedRoomTypeId) return;
    setSaving(true);
    try {
      await updateAllotment({
        room_type_id: selectedRoomTypeId,
        date: editingDay.date,
        price: editPrice,
        total_rooms: editTotalRooms,
        is_blocked: editIsBlocked,
      });

      // Reload allotments
      const refreshed = await getPropertyAllotments(selectedPropertyId, selectedMonth);
      setAllotmentData(refreshed);
      setEditingDay(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
      {/* Top Breadcrumb & Heading Ribbon */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-outline text-[11px] font-bold uppercase tracking-widest">
          <span>Resort Operation</span>
          <ChevronRight className="w-3.5 h-3.5 text-outline-variant" />
          <span className="text-primary font-extrabold">Allotments &amp; Yield Management</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
          Lịch Tồn Kho &amp; Giá Phòng (Allotments &amp; Rates)
        </h1>
        <p className="text-xs sm:text-base text-on-surface-variant max-w-2xl leading-relaxed">
          Quản trị hạn mức phân phối phòng, giá động và chính sách Stop-Sell theo ngày của các khu nghỉ dưỡng.
        </p>
      </div>

      <div className="w-full space-y-8">
        {error && (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
              <div className="text-xs font-semibold">
                {error.includes('UNAUTHORIZED') || error.includes('Authentication required') || error.includes('hết hạn')
                  ? 'Phiên đăng nhập quản trị đã hết hạn hoặc chưa được xác thực. Vui lòng đăng nhập lại để xem lịch tồn kho.'
                  : error}
              </div>
            </div>
            {(error.includes('UNAUTHORIZED') || error.includes('Authentication required') || error.includes('hết hạn')) && (
              <Link
                href="/login?callbackUrl=/admin/allotments"
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-xs whitespace-nowrap"
              >
                Đăng nhập lại
              </Link>
            )}
          </div>
        )}
        {/* Filter Controls Bar */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/40 shadow-sm flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-4">
            {/* Property Selector */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-outline mb-1">
                Khu Nghỉ Dưỡng
              </label>
              <select
                value={selectedPropertyId}
                onChange={(e) => {
                  setLoading(true);
                  setSelectedPropertyId(e.target.value);
                  setSelectedRoomTypeId('');
                }}
                className="h-11 px-4 rounded-xl border border-outline-variant/50 bg-surface-container-low text-xs font-bold text-on-surface focus:border-primary outline-hidden"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Room Type Selector */}
            {allotmentData?.room_types && (
              <div>
                <label className="block text-[10px] uppercase font-bold text-outline mb-1">
                  Hạng Phòng
                </label>
                <select
                  value={selectedRoomTypeId}
                  onChange={(e) => setSelectedRoomTypeId(e.target.value)}
                  className="h-11 px-4 rounded-xl border border-outline-variant/50 bg-surface-container-low text-xs font-bold text-on-surface focus:border-primary outline-hidden"
                >
                  {allotmentData.room_types.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Month Selector */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-outline mb-1">
                Tháng Vận Hành
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  setLoading(true);
                  setSelectedMonth(e.target.value);
                }}
                className="h-11 px-4 rounded-xl border border-outline-variant/50 bg-surface-container-low text-xs font-bold text-on-surface focus:border-primary outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Allotment Engine
            </span>
          </div>
        </div>

        {/* KPI Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-outline font-bold">Tỷ lệ lấp đầy (OCC)</span>
            <div className="text-2xl font-black text-primary">{occupancyRate}%</div>
            <p className="text-[11px] text-outline">{totalBooked} / {totalCapacity} lượt phòng đã đặt</p>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-outline font-bold">Giá ADR Bình Quân</span>
            <div className="text-2xl font-black text-on-surface">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(avgRate)}
            </div>
            <p className="text-[11px] text-outline">Tính theo lịch tháng này</p>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-outline font-bold">Số ngày khóa bán (Stop-Sell)</span>
            <div className={`text-2xl font-black ${blockedDaysCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {blockedDaysCount} ngày
            </div>
            <p className="text-[11px] text-outline">Tự động chặn đặt phòng</p>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-outline font-bold">Quota Tiêu Chuẩn</span>
            <div className="text-2xl font-black text-on-surface">
              {activeRoomType?.total_rooms || 10} phòng / ngày
            </div>
            <p className="text-[11px] text-outline">Hạn mức phân phối OTA</p>
          </div>
        </div>

        {/* Calendar Grid Header */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/40 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-4">
            <div>
              <h2 className="text-xl font-sans font-bold text-on-surface">
                {activeRoomType?.name || 'Hạng phòng'}
              </h2>
              <p className="text-xs text-outline mt-0.5">
                Nhấp vào ô ngày bất kỳ để thay đổi giá linh hoạt, điều chỉnh quota hoặc kích hoạt Stop-Sell
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-400" />
                <span>Còn phòng</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-100 border border-rose-400" />
                <span>Khóa bán (Stop-Sell)</span>
              </span>
            </div>
          </div>

          {/* Calendar Grid Days */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-outline">Đang tải lịch tồn kho...</p>
            </div>
          ) : allDays.length === 0 ? (
            <div className="py-12 text-center text-outline text-xs">
              Chưa có dữ liệu tồn kho cho tháng {selectedMonth}. Hệ thống sẽ sử dụng quota mặc định.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {allDays.map((day) => {
                const dateObj = new Date(day.date);
                const dayNum = dateObj.getDate();
                const isBlocked = day.is_blocked;
                const isSoldOut = day.available_rooms <= 0;

                return (
                  <button
                    key={day.date}
                    onClick={() => handleEditClick(day)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative group ${
                      isBlocked
                        ? 'bg-rose-50/70 border-rose-200 hover:border-rose-400'
                        : isSoldOut
                        ? 'bg-amber-50/70 border-amber-200 hover:border-amber-400'
                        : 'bg-surface-container-low border-outline-variant/30 hover:border-primary/60 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-base font-bold text-on-surface">
                        Ngày {dayNum}
                      </span>
                      {isBlocked ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-600 text-white uppercase">
                          Khóa
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700">
                          {day.available_rooms} trống
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-black text-primary truncate">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(day.price)}
                    </div>

                    <div className="text-[10px] text-outline mt-1">
                      Đã đặt: {day.booked_rooms}/{day.total_rooms}
                    </div>

                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit3 className="w-3.5 h-3.5 text-primary" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* EDIT ALLOTMENT DRAWER / MODAL */}
      {editingDay && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-7 border border-outline-variant/40 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-outline font-bold">Chỉnh Sửa Ngày</span>
                <h3 className="text-xl font-bold text-on-surface">
                  Ngày {editingDay.date}
                </h3>
              </div>
              <button
                onClick={() => setEditingDay(null)}
                className="p-2 rounded-full text-outline hover:text-on-surface hover:bg-surface-container cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAllotment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Giá Phòng (VND / đêm)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full h-11 px-4 rounded-xl border border-outline-variant/50 focus:border-primary text-base font-bold text-on-surface bg-surface-container-low"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Tổng Hạn Mức Quota (Phòng)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={editTotalRooms}
                  onChange={(e) => setEditTotalRooms(Number(e.target.value))}
                  className="w-full h-11 px-4 rounded-xl border border-outline-variant/50 focus:border-primary text-base font-bold text-on-surface bg-surface-container-low"
                  required
                />
              </div>

              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-on-surface block">Chặn Bán Phòng (Stop-Sell)</span>
                  <p className="text-[10px] text-outline">Khóa ngày này, khách không thể tạo booking</p>
                </div>
                <input
                  type="checkbox"
                  checked={editIsBlocked}
                  onChange={(e) => setEditIsBlocked(e.target.checked)}
                  className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingDay(null)}
                  className="flex-1 h-11 rounded-full bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-11 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-primary-container hover:text-on-primary-container transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

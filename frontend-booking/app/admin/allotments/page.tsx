'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  CalendarDays,
  Building2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Save,
  X,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  BedDouble,
  DollarSign,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import {
  usePropertiesQuery,
  usePropertyAllotmentsQuery,
  useUpdateAllotmentMutation,
} from '@/features/catalog/hooks/use-catalog';
import type { AllotmentDay } from '@/features/catalog/service/catalog.client';
import { luxuryAlert } from '@/lib/alert/luxury-alert';

interface CalendarDayItem {
  date: string;
  dayNum: number;
  dayOfWeek: number;
  allotment: AllotmentDay;
}

interface CalendarMonthState {
  mondayOffset: number;
  days: CalendarDayItem[];
}

export default function AdminAllotmentsPage() {
  const { data: session, status: authStatus } = useSession();

  const user = session?.user as
    | {
        role?: string;
        managedPropertyId?: string | null;
        accessibleProperties?: Array<{ id: string; name: string }>;
      }
    | undefined;

  const managedPropertyId = user?.managedPropertyId ?? undefined;
  const isPartner = Boolean(managedPropertyId || user?.role === 'HOTEL_PARTNER');

  // Month state (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  // Property selection state
  const { data: propertiesData, isLoading: propertiesLoading } = usePropertiesQuery();

  const availableProperties = useMemo(
    () => propertiesData?.items || [],
    [propertiesData?.items],
  );

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  useEffect(() => {
    if (managedPropertyId) {
      setSelectedPropertyId(managedPropertyId);
    } else if (!selectedPropertyId && availableProperties.length > 0) {
      setSelectedPropertyId(availableProperties[0].id);
    }
  }, [managedPropertyId, availableProperties, selectedPropertyId]);

  // Query allotments for selected property and month
  const {
    data: allotmentsData,
    isLoading: allotmentsLoading,
    error: allotmentsError,
    refetch,
  } = usePropertyAllotmentsQuery(
    {
      property_id: selectedPropertyId,
      month: selectedMonth,
    },
    { enabled: Boolean(selectedPropertyId) && authStatus === 'authenticated' },
  );

  const roomTypes = useMemo(
    () => allotmentsData?.room_types || [],
    [allotmentsData?.room_types],
  );

  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>('');

  useEffect(() => {
    if (roomTypes.length > 0) {
      const exists = roomTypes.some((rt) => rt.id === selectedRoomTypeId);
      if (!exists) {
        setSelectedRoomTypeId(roomTypes[0].id);
      }
    }
  }, [roomTypes, selectedRoomTypeId]);

  const activeRoomType = useMemo(
    () => roomTypes.find((rt) => rt.id === selectedRoomTypeId) || roomTypes[0],
    [roomTypes, selectedRoomTypeId],
  );

  // Build full month calendar days
  const calendarDays = useMemo<CalendarMonthState>(() => {
    if (!selectedMonth || !activeRoomType) {
      return { mondayOffset: 0, days: [] };
    }

    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 is Sunday
    // Vietnam standard: Monday is first day of week (0: Mon, ..., 6: Sun)
    const mondayOffset = (firstDayOfWeek + 6) % 7;

    const existingMap = new Map<string, AllotmentDay>();
    (activeRoomType.allotments || []).forEach((a) => {
      existingMap.set(a.date, a);
    });

    const days: CalendarDayItem[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const existing = existingMap.get(dateStr);
      const defaultAllotment: AllotmentDay = existing || {
        date: dateStr,
        total_rooms: activeRoomType.total_rooms || 10,
        booked_rooms: 0,
        available_rooms: activeRoomType.total_rooms || 10,
        price: activeRoomType.base_price,
        is_blocked: false,
      };

      days.push({
        date: dateStr,
        dayNum: d,
        dayOfWeek: (mondayOffset + d - 1) % 7,
        allotment: defaultAllotment,
      });
    }

    return {
      mondayOffset,
      days,
    };
  }, [selectedMonth, activeRoomType]);

  // Edit Modal State
  const [editingDay, setEditingDay] = useState<AllotmentDay | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editTotalRooms, setEditTotalRooms] = useState<number>(10);
  const [editIsBlocked, setEditIsBlocked] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const updateMutation = useUpdateAllotmentMutation();

  const handleOpenEdit = (allotment: AllotmentDay) => {
    setEditingDay(allotment);
    setEditPrice(allotment.price);
    setEditTotalRooms(allotment.total_rooms);
    setEditIsBlocked(allotment.is_blocked);
  };

  const handleCloseEdit = () => {
    setEditingDay(null);
  };

  const handleSaveAllotment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDay || !activeRoomType) return;

    if (editTotalRooms < editingDay.booked_rooms) {
      luxuryAlert.error({
        title: 'Hạn mức phòng không hợp lệ',
        message: `Tổng số phòng (${editTotalRooms}) không thể nhỏ hơn số phòng đã được khách đặt (${editingDay.booked_rooms} phòng).`,
      });
      return;
    }

    setSaving(true);
    try {
      await updateMutation.mutateAsync({
        room_type_id: activeRoomType.id,
        date: editingDay.date,
        price: editPrice,
        total_rooms: editTotalRooms,
        is_blocked: editIsBlocked,
      });

      await luxuryAlert.success({
        title: 'Cập Nhật Lịch Thành Công',
        message: `Đã cập nhật lịch ngày ${editingDay.date} thành công.`,
        confirmText: 'Đã Hiểu',
      });
      handleCloseEdit();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể lưu thay đổi tồn kho';
      luxuryAlert.error({
        title: 'Cập nhật thất bại',
        message,
      });
    } finally {
      setSaving(false);
    }
  };

  // Month navigators
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    setSelectedMonth(
      `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`,
    );
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    setSelectedMonth(
      `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`,
    );
  };

  // Quick Stats
  const stats = useMemo(() => {
    if (!calendarDays.days || calendarDays.days.length === 0) {
      return { totalDays: 0, blockedDays: 0, soldOutDays: 0, bookedTotal: 0 };
    }
    const days = calendarDays.days;
    return {
      totalDays: days.length,
      blockedDays: days.filter((d) => d.allotment.is_blocked).length,
      soldOutDays: days.filter(
        (d) => !d.allotment.is_blocked && d.allotment.available_rooms <= 0,
      ).length,
      bookedTotal: days.reduce((sum, d) => sum + d.allotment.booked_rooms, 0),
    };
  }, [calendarDays]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }),
    [],
  );

  const weekHeaders = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-outline text-xs font-bold uppercase tracking-widest">
            <CalendarDays className="w-4 h-4 text-primary" />
            <span>{isPartner ? 'Đối Tác Cơ Sở' : 'Quản Trị Quỹ Phòng'}</span>
            <span className="text-outline-variant">•</span>
            <span className="text-primary font-extrabold">{isPartner ? 'Quỹ Phòng & Giá Bán' : 'Tồn Kho & Giá Động'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight text-balance">
            {isPartner ? 'Lịch Quỹ Phòng & Giá Bán' : 'Lịch Tồn Kho & Giá Động'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={allotmentsLoading}
            className="px-4 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all flex items-center gap-2 border border-outline-variant/30 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-outline ${
                allotmentsLoading ? 'animate-spin text-primary' : ''
              }`}
            />
            <span>Đồng Bộ Lại</span>
          </button>
        </div>
      </div>

      {/* 2. CONTROLS: PROPERTY & MONTH SELECTOR */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-2xs space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
          {/* Property Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
              Cơ Sở Lưu Trú (Property)
            </label>
            {managedPropertyId ? (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-on-surface">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-bold truncate">
                  {allotmentsData?.property_name || 'Cơ Sở Quản Lý Liên Kết'}
                </span>
                <span className="ml-auto text-xs font-extrabold bg-primary/10 text-primary px-2 py-0.5 rounded-md uppercase">
                  Đã Khóa
                </span>
              </div>
            ) : (
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                disabled={propertiesLoading}
                className="w-full h-11 px-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 focus:border-primary text-xs font-bold text-on-surface cursor-pointer"
              >
                {availableProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.city})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Month Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
              Tháng Vận Hành
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/40 text-on-surface cursor-pointer transition-colors"
                title="Tháng trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="flex-1 h-11 px-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 focus:border-primary text-xs font-bold text-on-surface text-center cursor-pointer"
              />
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/40 text-on-surface cursor-pointer transition-colors"
                title="Tháng sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Status Badge */}
          <div className="flex items-center gap-3 pt-2 md:pt-6">
            <div className="flex-1 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
              <span className="text-xs font-bold text-outline">Trạng Thái Lưới:</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Hoạt Động Trực Tuyến</span>
              </span>
            </div>
          </div>
        </div>

        {/* Room Types Tabs */}
        {roomTypes.length > 0 && (
          <div className="pt-2 border-t border-outline-variant/20">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-bold uppercase tracking-wider text-outline shrink-0 mr-2 flex items-center gap-1">
                <BedDouble className="w-3.5 h-3.5" />
                <span>Hạng Phòng:</span>
              </span>
              {roomTypes.map((rt) => {
                const isActive = rt.id === (activeRoomType?.id || '');
                return (
                  <button
                    key={rt.id}
                    type="button"
                    onClick={() => setSelectedRoomTypeId(rt.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                      isActive
                        ? isPartner
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant/30'
                    }`}
                  >
                    <span>{rt.name}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? isPartner
                            ? 'bg-emerald-800 text-white'
                            : 'bg-[#684f2c] text-white'
                          : 'bg-surface-container text-outline'
                      }`}
                    >
                      {currencyFormatter.format(rt.base_price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. QUICK KPI SUMMARY */}
      {activeRoomType && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/30 space-y-1">
            <span className="text-xs uppercase font-bold text-outline tracking-wider block">
              Giá Cơ Bản (Base Price)
            </span>
            <div className="text-lg sm:text-xl font-extrabold text-primary truncate">
              {currencyFormatter.format(activeRoomType.base_price)}
            </div>
            <span className="text-xs text-outline">Áp dụng cho ngày chưa có cấu hình</span>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/30 space-y-1">
            <span className="text-xs uppercase font-bold text-outline tracking-wider block">
              Tổng Quota Tháng
            </span>
            <div className="text-lg sm:text-xl font-extrabold text-on-surface">
              {stats.totalDays} ngày
            </div>
            <span className="text-xs text-emerald-700 font-bold">
              {stats.totalDays - stats.blockedDays} ngày đang mở bán
            </span>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/30 space-y-1">
            <span className="text-xs uppercase font-bold text-outline tracking-wider block">
              Đang Chặn Bán (Stop-Sell)
            </span>
            <div className="text-lg sm:text-xl font-extrabold text-rose-700">
              {stats.blockedDays} ngày
            </div>
            <span className="text-xs text-outline">Khóa đặt phòng trên toàn bộ OTA</span>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/30 space-y-1">
            <span className="text-xs uppercase font-bold text-outline tracking-wider block">
              Tổng Lượt Phòng Đã Đặt
            </span>
            <div className="text-lg sm:text-xl font-extrabold text-on-surface">
              {stats.bookedTotal} đêm
            </div>
            <span className="text-xs text-outline">Theo dữ liệu ghi nhận tại OTA</span>
          </div>
        </div>
      )}

      {/* 4. CALENDAR MATRIX GRID */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/30 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-on-surface">
                Ma Trận Lịch Tháng {selectedMonth}
              </h2>
              <p className="text-xs text-outline">
                Hạng phòng: <span className="font-bold text-on-surface">{activeRoomType?.name || '---'}</span> • Nhấp vào ngày bất kỳ để điều chỉnh giá &amp; quota
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs font-bold text-outline">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-md bg-emerald-500" />
              <span>Mở bán</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-md bg-amber-500" />
              <span>Hết phòng</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-md bg-rose-500" />
              <span>Stop-Sell</span>
            </span>
          </div>
        </div>

        {allotmentsLoading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-outline">Đang tải dữ liệu hạn mức phòng...</p>
          </div>
        ) : allotmentsError ? (
          <div className="py-16 text-center space-y-3 max-w-md mx-auto">
            <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
            <h3 className="text-base font-bold text-on-surface">Không Thể Tải Dữ Liệu Tồn Kho</h3>
            <p className="text-xs text-outline leading-relaxed">
              {allotmentsError instanceof Error
                ? allotmentsError.message
                : 'Đã có lỗi xảy ra trong quá trình truy vấn lịch allotment.'}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-5 py-2 rounded-full bg-primary hover:bg-[#684f2c] text-on-primary text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Thử Lại
            </button>
          </div>
        ) : !calendarDays.days || calendarDays.days.length === 0 ? (
          <div className="py-16 text-center text-xs text-outline">
            Chưa có dữ liệu phòng cho cơ sở lưu trú này.
          </div>
        ) : (
          <div>
            {/* Week Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center">
              {weekHeaders.map((header) => (
                <div
                  key={header}
                  className="py-2 text-xs font-extrabold uppercase tracking-wider text-outline bg-surface-container-low rounded-xl"
                >
                  {header}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {/* Empty leading offset days */}
              {Array.from({ length: calendarDays.mondayOffset }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="min-h-[110px] rounded-2xl bg-surface-container-low/40 border border-outline-variant/10 opacity-30 pointer-events-none"
                />
              ))}

              {/* Month Days */}
              {calendarDays.days.map(({ date, dayNum, allotment }) => {
                const isBlocked = allotment.is_blocked;
                const isSoldOut = !isBlocked && allotment.available_rooms <= 0;

                let cardStyle =
                  'bg-surface-container-low border-outline-variant/30 hover:border-primary/60 hover:shadow-sm';
                let badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                let badgeText = `${allotment.available_rooms} phòng`;

                if (isBlocked) {
                  cardStyle = 'bg-rose-50/60 border-rose-200/80 hover:border-rose-400';
                  badgeStyle = 'bg-rose-600 text-white';
                  badgeText = 'Khóa';
                } else if (isSoldOut) {
                  cardStyle = 'bg-amber-50/60 border-amber-200/80 hover:border-amber-400';
                  badgeStyle = 'bg-amber-500 text-white';
                  badgeText = 'Hết phòng';
                }

                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => handleOpenEdit(allotment)}
                    className={`min-h-[115px] sm:min-h-[125px] p-3 rounded-2xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between ${cardStyle}`}
                  >
                    {/* Top Row: Date & Status */}
                    <div className="flex items-start justify-between gap-1 w-full">
                      <span className="text-sm sm:text-base font-extrabold text-on-surface">
                        {dayNum}
                      </span>
                      <span
                        className={`text-xs font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${badgeStyle}`}
                      >
                        {badgeText}
                      </span>
                    </div>

                    {/* Middle: Price */}
                    <div className="my-1">
                      <div className="text-xs sm:text-sm font-extrabold text-primary truncate">
                        {currencyFormatter.format(allotment.price)}
                      </div>
                      <div className="text-xs text-outline font-semibold">
                        Đã đặt: {allotment.booked_rooms}/{allotment.total_rooms}
                      </div>
                    </div>

                    {/* Bottom: Hover Hint */}
                    <div className="flex items-center justify-between text-xs text-outline opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Chỉnh sửa</span>
                      <Edit3 className="w-3 h-3 text-primary" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 5. EDIT ALLOTMENT DRAWER / MODAL */}
      {editingDay && activeRoomType && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-outline-variant/40 shadow-2xl space-y-6">
            <div className="flex justify-between items-start border-b border-outline-variant/20 pb-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-outline font-bold block">
                  Cập Nhật Lịch &amp; Giá Động
                </span>
                <h3 className="text-xl font-extrabold text-on-surface mt-0.5">
                  Ngày {editingDay.date}
                </h3>
                <p className="text-xs text-primary font-bold mt-0.5">
                  Hạng phòng: {activeRoomType.name}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="p-2 rounded-full text-outline hover:text-on-surface hover:bg-surface-container cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAllotment} className="space-y-5">
              {/* Price Input */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  Giá Phòng Đêm Này (VND)
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
                <span className="text-xs text-outline mt-1 block">
                  Giá hiển thị: {currencyFormatter.format(editPrice || 0)} / đêm
                </span>
              </div>

              {/* Total Quota Rooms */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  Hạn Mức Phân Phối (Tổng Quota Phòng)
                </label>
                <input
                  type="number"
                  min={editingDay.booked_rooms || 1}
                  max="100"
                  value={editTotalRooms}
                  onChange={(e) => setEditTotalRooms(Number(e.target.value))}
                  className="w-full h-11 px-4 rounded-xl border border-outline-variant/50 focus:border-primary text-base font-bold text-on-surface bg-surface-container-low"
                  required
                />
                <div className="flex items-center justify-between text-xs text-outline mt-1">
                  <span>Phòng đã đặt: {editingDay.booked_rooms} phòng</span>
                  <span>Phòng trống khả dụng: {Math.max(0, editTotalRooms - editingDay.booked_rooms)} phòng</span>
                </div>
              </div>

              {/* Stop-Sell Toggle */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-on-surface block flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-rose-600" />
                    <span>Chặn Bán Phòng (Stop-Sell)</span>
                  </span>
                  <p className="text-xs text-outline mt-0.5">
                    Khi bật, toàn bộ khách hàng trên OTA sẽ không thể tạo đặt phòng cho ngày này.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={editIsBlocked}
                  onChange={(e) => setEditIsBlocked(e.target.checked)}
                  className="w-5 h-5 accent-rose-600 rounded cursor-pointer shrink-0"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="flex-1 h-11 rounded-full bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`flex-1 h-11 rounded-full text-white text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                    isPartner ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-primary hover:bg-[#684f2c]'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Đang Lưu...' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Car,
  UtensilsCrossed,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Printer,
  X,
  Phone,
  MessageSquare,
  QrCode,
  Save,
  Loader2,
  ChevronRight,
  Headphones,
} from 'lucide-react';
import { getBooking, updateBookingStatus } from '@/features/bookings/service/bookings.client';
import { LuxuryAlertBanner } from '@/components/shared/luxury-alert-banner';

type BookingItem = {
  id: string;
  booking_code: string;
  property_id: string;
  property_name: string;
  property_address?: string | null;
  room_type_name?: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  nights: number;
  total_price: number;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
  special_requests?: string | null;
  addons?: { service_name: string; price: number }[];
  created_at: string;
};

function BookingModifyContent() {
  const routeParams = useParams();
  const id = typeof routeParams?.id === 'string' ? routeParams.id : '';
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const [booking, setBooking] = useState<BookingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);

  // Tab 1 state: Check-in & Fast-track preferences
  const [arrivalTime, setArrivalTime] = useState('10:30 Sáng (Check-in sớm VIP miễn phí)');
  const [flightNumber, setFlightNumber] = useState('VN-1382');
  const [specialNote, setSpecialNote] = useState('');

  // Tab 2 state: Bespoke Addons
  const [addonMaybach, setAddonMaybach] = useState(true);
  const [addonDinner, setAddonDinner] = useState(false);
  const [addonSpa, setAddonSpa] = useState(true);
  const [addonPresidential, setAddonPresidential] = useState(false);

  // Tab 3 state: Reschedule dates
  const [newCheckIn, setNewCheckIn] = useState('');
  const [newCheckOut, setNewCheckOut] = useState('');

  // Modals & notices
  const [isButlerModalOpen, setIsButlerModalOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [butlerMessage, setButlerMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!id) return;
    setLoading(true);

    getBooking(id)
      .then((data) => {
        if (!isMounted) return;
        const b = data as BookingItem;
        setBooking(b);
        setNewCheckIn(b.check_in);
        setNewCheckOut(b.check_out);
        if (b.special_requests) {
          setSpecialNote(b.special_requests);
        }
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Không tìm thấy hồ sơ đặt phòng');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Pricing calculations
  const basePrice = booking?.total_price || 28500000;
  const maybachPrice = addonMaybach ? 500000 : 0;
  const dinnerPrice = addonDinner ? 3200000 : 0;
  const spaPrice = addonSpa ? 1800000 : 0;
  const presidentialPrice = addonPresidential ? 18000000 : 0;
  const addonsTotal = maybachPrice + dinnerPrice + spaPrice + presidentialPrice;
  const grandTotal = basePrice + addonsTotal;
  const difference = addonsTotal;

  const handleSaveChanges = () => {
    setActionLoading(true);
    setTimeout(() => {
      setActionLoading(false);
      setNotification({
        type: 'success',
        message: 'Các điều chỉnh lịch trình và dịch vụ đã được đồng bộ với Quản gia trưởng!',
      });
      setTimeout(() => {
        router.push('/my-bookings');
      }, 1500);
    }, 800);
  };

  const handleSendButlerRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!butlerMessage.trim()) return;

    setActionLoading(true);
    setTimeout(() => {
      setActionLoading(false);
      setIsButlerModalOpen(false);
      setButlerMessage('');
      setNotification({
        type: 'success',
        message: 'Yêu cầu của quý khách đã được chuyển trực tiếp đến Quản gia phụ trách căn biệt thự.',
      });
    }, 600);
  };

  const handleCancelStay = async () => {
    if (!booking) return;
    setActionLoading(true);
    try {
      await updateBookingStatus(booking.id, 'CANCELLED', 'Khách điều chỉnh hủy qua trang quản lý');
      setIsCancelConfirmOpen(false);
      setNotification({
        type: 'info',
        message: 'Đơn đặt phòng đã được hủy thành công. Hệ thống hoàn tiền tự động đang xử lý.',
      });
      setTimeout(() => {
        router.push('/my-bookings');
      }, 1800);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Hủy đơn thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-on-surface">Không Thể Tải Hồ Sơ Đặt Phòng</h2>
          <p className="text-xs text-outline">{error || 'Đơn phòng không tồn tại hoặc đã bị xóa.'}</p>
          <Link
            href="/my-bookings"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold"
          >
            Quay lại Kỳ nghỉ của tôi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 lg:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1320px] mx-auto space-y-6">
        {/* Top Breadcrumb & Quick Actions Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/my-bookings"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-outline hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kỳ nghỉ của tôi</span>
            </Link>
            <span className="text-outline-variant">•</span>
            <span className="text-xs font-mono font-bold text-primary bg-primary-container/20 px-2.5 py-0.5 rounded-full">
              {booking.booking_code}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsButlerModalOpen(true)}
              className="px-4 py-2 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Headphones className="w-3.5 h-3.5 text-primary" />
              <span>Quản Gia Riêng 24/7</span>
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleSaveChanges}
              className="px-6 py-2 rounded-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu Thay Đổi</span>
            </button>
          </div>
        </div>

        {/* Hero Banner with Booking Details */}
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-md p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/20 text-primary text-xs font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Điều Chỉnh Hành Trình Nghỉ Dưỡng</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-sans font-bold text-on-surface tracking-tight">
              {booking.property_name}
            </h1>
            <p className="text-xs text-outline">
              Hạng phòng: <strong>{booking.room_type_name || 'Biệt thự cao cấp'}</strong> • Thời gian lưu trú:{' '}
              <strong>
                {booking.check_in} → {booking.check_out} ({booking.nights} đêm)
              </strong>
            </p>
          </div>

          <div className="text-left lg:text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">Tổng Thanh Toán Dự Kiến</span>
            <div className="text-2xl sm:text-3xl font-black text-primary">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(grandTotal)}
            </div>
            <span className="text-xs text-emerald-700 font-semibold">
              ● Trạng thái đơn: {booking.status}
            </span>
          </div>
        </div>

        {/* Status Notification */}
        {notification && (
          <LuxuryAlertBanner
            variant={notification.type === 'error' ? 'error' : 'success'}
            description={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Main Grid: Tabs and Actions (8 cols) + Cost Summary (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT 8 COLS: Tabs & Forms */}
          <div className="lg:col-span-8 space-y-6">
            {/* Tab Navigation */}
            <div className="bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/20 shadow-inner flex flex-wrap sm:flex-nowrap gap-1">
              {[
                { id: 1 as const, label: '1. Check-in & Fast-track', icon: Clock },
                { id: 2 as const, label: '2. Trải Nghiệm & Tiện Ích', icon: Sparkles },
                { id: 3 as const, label: '3. Đổi Ngày & Hoàn Hủy', icon: Calendar },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-surface-container-lowest text-primary shadow-sm font-extrabold border border-outline-variant/30'
                        : 'text-outline hover:text-on-surface'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: Fast-track Check-in Online & E-Pass */}
            {activeTab === 1 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-6 sm:p-8 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                    <div>
                      <h3 className="text-xl font-sans font-bold text-on-surface">
                        Thủ Tục Nhận Phòng Ưu Tiên (Fast-track)
                      </h3>
                      <p className="text-xs text-outline mt-0.5">
                        Bỏ qua hàng chờ lễ tân, nhận phòng trực tiếp ngay khi xe đưa đón lăn bánh vào khuôn viên.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      Đã kích hoạt
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Guest ID Verification Info */}
                    <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                          1. Định Danh Du Khách
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-xs text-outline">
                        CCCD/Hộ chiếu đã liên kết an toàn: <strong>{booking.guest_name}</strong>
                      </p>
                      <span className="text-[11px] text-primary font-semibold">
                        ✓ Miễn kiểm tra lại tại sảnh đón
                      </span>
                    </div>

                    {/* Arrival Time Selection */}
                    <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                          2. Giờ Nhận Phòng Dự Kiến
                        </label>
                        <Clock className="w-4 h-4 text-primary" />
                      </div>
                      <select
                        value={arrivalTime}
                        onChange={(e) => setArrivalTime(e.target.value)}
                        className="w-full p-2.5 bg-surface-container-lowest rounded-xl text-xs font-semibold text-on-surface border border-outline-variant/30 focus:border-primary outline-hidden"
                      >
                        <option>10:30 Sáng (Check-in sớm VIP miễn phí)</option>
                        <option>12:00 Trưa (Trưa hoàng kim)</option>
                        <option>14:00 Chiều (Giờ chuẩn resort)</option>
                        <option>18:00 Tối (Đón hoàng hôn biển)</option>
                      </select>
                      <span className="text-[11px] text-emerald-700 font-semibold block">
                        ★ Đặc quyền Gold Elite: Hỗ trợ nhận phòng sớm lúc 10:30
                      </span>
                    </div>
                  </div>

                  {/* Flight & Transfer info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
                        Số Hiệu Chuyến Bay Đến (Nếu có xe đón)
                      </label>
                      <input
                        type="text"
                        value={flightNumber}
                        onChange={(e) => setFlightNumber(e.target.value)}
                        placeholder="Ví dụ: VN-1382"
                        className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30 text-xs font-semibold text-on-surface"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
                        Yêu Cầu Đặc Biệt Cho Quản Gia
                      </label>
                      <input
                        type="text"
                        value={specialNote}
                        onChange={(e) => setSpecialNote(e.target.value)}
                        placeholder="Nước khoáng có ga, hoa tươi mừng kỷ niệm..."
                        className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30 text-xs font-semibold text-on-surface"
                      />
                    </div>
                  </div>

                  {/* Smart Keyless Access Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-5">
                    <div className="space-y-1 text-center sm:text-left">
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary">
                        Aurum Smart Keyless Access
                      </span>
                      <h4 className="text-base font-bold text-on-surface">Chìa Khóa Số Di Động &amp; Thẻ VIP QR</h4>
                      <p className="text-xs text-outline">
                        Xuất trình mã này hoặc mở khóa cửa biệt thự trực tiếp qua giao thức NFC điện thoại.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-16 h-16 rounded-xl bg-white p-1 border shadow-xs flex items-center justify-center">
                        <QrCode className="w-12 h-12 text-on-surface" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="px-3.5 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface text-xs font-bold hover:bg-surface-container-high transition-colors flex items-center gap-1.5 cursor-pointer border border-outline-variant/30"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>In Phiếu E-Voucher</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Bespoke Addon Services */}
            {activeTab === 2 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-6 sm:p-8 shadow-sm space-y-6">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-widest text-primary">
                      Tùy Biến Trải Nghiệm
                    </span>
                    <h3 className="text-xl font-sans font-bold text-on-surface mt-0.5">
                      Gia Tăng Tiện Ích Độc Bản Trong Chuyến Đi
                    </h3>
                    <p className="text-xs text-outline mt-1">
                      Chọn thêm các dịch vụ thượng hạng đã được bảo chứng giá ưu đãi dành riêng cho thành viên Gold Elite.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Addon 1: Maybach */}
                    <div
                      onClick={() => setAddonMaybach(!addonMaybach)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        addonMaybach
                          ? 'border-primary bg-primary-container/10 shadow-xs'
                          : 'border-outline-variant/30 bg-surface-container-low hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center shrink-0 text-primary">
                          <Car className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-extrabold text-on-surface">
                              Đưa Đón Xe Sang Maybach Từ Sân Bay
                            </h4>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-primary text-on-primary uppercase font-bold">
                              Voucher VIP -80%
                            </span>
                          </div>
                          <p className="text-xs text-outline mt-0.5">
                            Tài xế riêng lịch thiệp đón tận cửa máy bay, phục vụ nước khoáng và khăn ướp tinh dầu.
                          </p>
                          <div className="pt-1 flex items-center gap-2">
                            <span className="text-sm font-black text-primary">500.000 ₫</span>
                            <span className="line-through text-xs text-outline">2.500.000 ₫</span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                          addonMaybach ? 'bg-primary border-primary text-white' : 'border-outline-variant'
                        }`}
                      >
                        {addonMaybach && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Addon 2: Candlelit Dinner */}
                    <div
                      onClick={() => setAddonDinner(!addonDinner)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        addonDinner
                          ? 'border-primary bg-primary-container/10 shadow-xs'
                          : 'border-outline-variant/30 bg-surface-container-low hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center shrink-0 text-primary">
                          <UtensilsCrossed className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-extrabold text-on-surface">
                              Dạ Tiệc Ánh Nến Riêng Biệt Bờ Sóng
                            </h4>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">
                              Michelin Menu
                            </span>
                          </div>
                          <p className="text-xs text-outline mt-0.5">
                            Set ẩm thực hải sản Địa Trung Hải kết hợp vang trắng Grand Cru, nhạc acoustic violin.
                          </p>
                          <div className="pt-1 flex items-center gap-1.5">
                            <span className="text-sm font-black text-primary">3.200.000 ₫</span>
                            <span className="text-xs text-outline">/ Cặp đôi</span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                          addonDinner ? 'bg-primary border-primary text-white' : 'border-outline-variant'
                        }`}
                      >
                        {addonDinner && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Addon 3: Jade Herbal Spa */}
                    <div
                      onClick={() => setAddonSpa(!addonSpa)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        addonSpa
                          ? 'border-primary bg-primary-container/10 shadow-xs'
                          : 'border-outline-variant/30 bg-surface-container-low hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center shrink-0 text-primary">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-on-surface">
                            Gói Spa Thảo Mộc Ngọc Bích 90 Phút
                          </h4>
                          <p className="text-xs text-outline mt-0.5">
                            Massage đá nóng núi lửa, tẩy tế bào chết với ngọc bích nghiền và dầu thơm gỗ tuyết tùng.
                          </p>
                          <div className="pt-1 flex items-center gap-1.5">
                            <span className="text-sm font-black text-primary">1.800.000 ₫</span>
                            <span className="text-xs text-outline">/ Khách</span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                          addonSpa ? 'bg-primary border-primary text-white' : 'border-outline-variant'
                        }`}
                      >
                        {addonSpa && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Addon 4: Presidential Suite Upgrade */}
                    <div
                      onClick={() => setAddonPresidential(!addonPresidential)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        addonPresidential
                          ? 'border-primary bg-primary-container/10 shadow-xs'
                          : 'border-outline-variant/30 bg-surface-container-low hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center shrink-0 text-primary">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-extrabold text-on-surface">
                              Nâng Cấp Villa Tổng Thống Presidential Cliffside
                            </h4>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 font-bold">
                              Chỉ còn 1 căn
                            </span>
                          </div>
                          <p className="text-xs text-outline mt-0.5">
                            Không gian 320 m² vươn mình trên mỏm đá, hồ bơi 2 tầng và quản gia riêng biệt.
                          </p>
                          <div className="pt-1 flex items-center gap-1.5">
                            <span className="text-sm font-black text-primary">+6.000.000 ₫</span>
                            <span className="text-xs text-outline">/ đêm (Tổng: 18.000.000 ₫)</span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                          addonPresidential ? 'bg-primary border-primary text-white' : 'border-outline-variant'
                        }`}
                      >
                        {addonPresidential && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Reschedule Dates & Cancellation Policy */}
            {activeTab === 3 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-6 sm:p-8 shadow-sm space-y-6">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-widest text-primary">
                      Linh Hoạt Lịch Trình
                    </span>
                    <h3 className="text-xl font-sans font-bold text-on-surface mt-0.5">
                      Đổi Lịch Nghỉ Dưỡng Hoặc Hoàn Tiền
                    </h3>
                    <p className="text-xs text-outline mt-1">
                      Thay đổi ngày lưu trú tức thì không phát sinh phí quản lý. Cam kết bảo lưu giá trị đặt phòng tốt nhất.
                    </p>
                  </div>

                  {/* Reschedule Date Pickers */}
                  <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-3">
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>Chọn lại ngày Nhận - Trả phòng (Miễn phí 01 lần đổi ngày)</span>
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-outline font-semibold mb-1">
                          Ngày Nhận Phòng Mới
                        </label>
                        <input
                          type="date"
                          value={newCheckIn}
                          onChange={(e) => setNewCheckIn(e.target.value)}
                          className="w-full p-3 rounded-xl bg-surface-container-lowest text-sm font-semibold text-on-surface border border-outline-variant/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-outline font-semibold mb-1">
                          Ngày Trả Phòng Mới
                        </label>
                        <input
                          type="date"
                          value={newCheckOut}
                          onChange={(e) => setNewCheckOut(e.target.value)}
                          className="w-full p-3 rounded-xl bg-surface-container-lowest text-sm font-semibold text-on-surface border border-outline-variant/30"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cancellation Guarantee Card */}
                  <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-rose-900">Chính Sách Hủy Linh Hoạt 100%</h4>
                      <span className="text-xs font-semibold text-rose-700">Miễn phí trước 48 giờ</span>
                    </div>
                    <p className="text-xs text-rose-800 leading-relaxed">
                      Quý khách có thể hủy đơn đặt phòng này mà không mất bất kỳ khoản phí phạt nào. Số tiền đã thanh toán (nếu có) sẽ được hoàn trả tự động về tài khoản nguồn trong vòng 24 giờ.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsCancelConfirmOpen(true)}
                      className="px-4 py-2 rounded-xl bg-surface-container-lowest text-rose-700 border border-rose-300 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      Yêu Cầu Hủy Kỳ Nghỉ Này
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT 4 COLS: Sticky Cost Summary & Butler Quick Help */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-6 sm:p-7 shadow-md space-y-5 sticky top-24">
              <h3 className="text-lg font-sans font-bold text-on-surface border-b border-outline-variant/20 pb-3">
                Tóm Tắt Chi Phí
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-outline">
                  <span>Giá phòng cơ bản ({booking.nights} đêm):</span>
                  <span className="font-bold text-on-surface">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(basePrice)}
                  </span>
                </div>

                {addonMaybach && (
                  <div className="flex justify-between text-outline">
                    <span>Đưa đón xe sang Maybach:</span>
                    <span className="font-bold text-primary">+500.000 ₫</span>
                  </div>
                )}

                {addonDinner && (
                  <div className="flex justify-between text-outline">
                    <span>Dạ tiệc Michelin bờ sóng:</span>
                    <span className="font-bold text-primary">+3.200.000 ₫</span>
                  </div>
                )}

                {addonSpa && (
                  <div className="flex justify-between text-outline">
                    <span>Gói Spa ngọc bích 90 phút:</span>
                    <span className="font-bold text-primary">+1.800.000 ₫</span>
                  </div>
                )}

                {addonPresidential && (
                  <div className="flex justify-between text-outline">
                    <span>Nâng hạng Presidential Villa:</span>
                    <span className="font-bold text-primary">+18.000.000 ₫</span>
                  </div>
                )}

                <div className="border-t border-outline-variant/20 pt-3 flex justify-between items-center text-sm">
                  <span className="font-bold text-on-surface">Tổng chi phí mới:</span>
                  <span className="font-black text-xl text-primary">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(grandTotal)}
                  </span>
                </div>

                {difference > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium leading-relaxed">
                    Chênh lệch thanh toán thêm: <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(difference)}</strong>. Số tiền này sẽ được thanh toán trực tiếp tại sảnh đón hoặc qua thẻ tín dụng lưu trữ.
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleSaveChanges}
                  className="w-full py-3.5 rounded-full bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-extrabold text-sm tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu điều chỉnh...</span>
                    </>
                  ) : (
                    <span>Xác Nhận Thay Đổi</span>
                  )}
                </button>
                <Link
                  href="/my-bookings"
                  className="w-full py-2.5 rounded-full bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-colors text-center block"
                >
                  Quay lại Kỳ nghỉ của tôi
                </Link>
              </div>

              {/* Butler Help Box */}
              <div className="pt-4 border-t border-outline-variant/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0 text-primary">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-on-surface">Cần hỗ trợ cá nhân hóa?</div>
                  <div className="text-[11px] text-outline">
                    Gọi quản gia:{' '}
                    <a href="tel:+84288888LUXE" className="text-primary font-bold hover:underline">
                      +84 28 8888 LUXE
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BUTLER REQUEST MODAL */}
      {isButlerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-7 border border-outline-variant/30 shadow-2xl space-y-4 relative">
            <button
              type="button"
              onClick={() => setIsButlerModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-primary-container/20 text-primary flex items-center justify-center mx-auto mb-2">
                <Headphones className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-on-surface">Hỗ Trợ Riêng Bởi Quản Gia</h3>
              <p className="text-xs text-outline">
                Gửi yêu cầu may đo riêng cho kỳ nghỉ tại {booking.property_name}
              </p>
            </div>

            <form onSubmit={handleSendButlerRequest} className="space-y-4 pt-2">
              <textarea
                required
                rows={4}
                value={butlerMessage}
                onChange={(e) => setButlerMessage(e.target.value)}
                placeholder="Ví dụ: Chúng tôi có mặt vào lúc 11:00, mong muốn chuẩn bị thêm một bình trà thảo mộc hoa cúc ấm tại phòng khách..."
                className="w-full p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/30 text-xs font-medium text-on-surface placeholder:text-outline/60 focus:border-primary outline-hidden"
              />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsButlerModalOpen(false)}
                  className="flex-1 py-2.5 rounded-full bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-primary-container hover:text-on-primary-container transition-colors cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Đang gửi...' : 'Gửi Đến Quản Gia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL CONFIRMATION MODAL */}
      {isCancelConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-7 border border-outline-variant/30 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-on-surface">Xác Nhận Hủy Kỳ Nghỉ?</h3>
              <p className="text-xs text-outline leading-relaxed">
                Quý khách có chắc chắn muốn hủy đơn đặt phòng <strong>{booking.booking_code}</strong> không? Chính sách hủy miễn phí 100% sẽ được kích hoạt ngay lập tức.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsCancelConfirmOpen(false)}
                className="flex-1 h-11 rounded-full bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Giữ lại phòng
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleCancelStay}
                className="flex-1 h-11 rounded-full bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Đang hủy...' : 'Xác Nhận Hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingModifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-outline">Đang kết nối hành trình lưu trú...</p>
          </div>
        </div>
      }
    >
      <BookingModifyContent />
    </Suspense>
  );
}

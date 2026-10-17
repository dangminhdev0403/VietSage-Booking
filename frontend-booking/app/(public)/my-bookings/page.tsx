'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Calendar,
  CheckCircle2,
  QrCode,
  ShieldAlert,
  X,
  CreditCard,
  Printer,
  BedDouble,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Award,
  Ticket,
  Clock,
  Car,
  UtensilsCrossed,
  Coffee,
  KeyRound,
  Edit,
  Headphones,
  Compass,
  ChevronRight,
  ArrowRight,
  Timer,
  Phone,
} from 'lucide-react';
import { listBookings, updateBookingStatus, createPaymentIntent } from '@/features/bookings/service/bookings.client';
import { UserMenu } from '@/features/auth/components/user-menu';

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

type PaymentIntentData = {
  id: string;
  booking_id: string;
  booking_code: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  transaction_ref: string;
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  transfer_content: string;
  qr_code_url: string;
  created_at: string;
};

type BookingFilterTab = 'ALL' | 'UPCOMING' | 'PENDING' | 'COMPLETED' | 'CANCELLED';

export default function MyBookingsPage() {
  const { data: session, status: authStatus } = useSession();
  const [activeTab, setActiveTab] = useState<BookingFilterTab>('ALL');
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [selectedVoucherBooking, setSelectedVoucherBooking] = useState<BookingItem | null>(null);
  const [selectedPaymentBooking, setSelectedPaymentBooking] = useState<BookingItem | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentData | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<BookingItem | null>(null);
  const [isButlerModalOpen, setIsButlerModalOpen] = useState(false);
  const [butlerBookingTarget, setButlerBookingTarget] = useState<BookingItem | null>(null);
  const [butlerMessage, setButlerMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  const reloadBookings = useCallback(() => {
    if (!session) return;
    setLoading(true);
    let filterStatus: string | undefined = undefined;
    if (activeTab === 'PENDING') filterStatus = 'PENDING';
    if (activeTab === 'UPCOMING') filterStatus = 'CONFIRMED';
    if (activeTab === 'COMPLETED') filterStatus = 'COMPLETED';
    if (activeTab === 'CANCELLED') filterStatus = 'CANCELLED';

    listBookings({ status: filterStatus })
      .then((data) => {
        setBookings((data.items || []) as BookingItem[]);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách đơn đặt phòng');
        setLoading(false);
      });
  }, [session, activeTab]);

  useEffect(() => {
    let isMounted = true;
    if (!session) return;

    setLoading(true);
    let filterStatus: string | undefined = undefined;
    if (activeTab === 'PENDING') filterStatus = 'PENDING';
    if (activeTab === 'UPCOMING') filterStatus = 'CONFIRMED';
    if (activeTab === 'COMPLETED') filterStatus = 'COMPLETED';
    if (activeTab === 'CANCELLED') filterStatus = 'CANCELLED';

    listBookings({ status: filterStatus })
      .then((data) => {
        if (!isMounted) return;
        setBookings((data.items || []) as BookingItem[]);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách đơn đặt phòng');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [session, activeTab]);

  const handleOpenPayment = async (booking: BookingItem) => {
    setSelectedPaymentBooking(booking);
    setPaymentNotice(null);
    setActionLoading(true);
    try {
      const intent = (await createPaymentIntent(booking.id, 'VIETQR')) as PaymentIntentData;
      setPaymentIntent(intent);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể khởi tạo mã VietQR');
      setSelectedPaymentBooking(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckPaymentStatus = async () => {
    if (!selectedPaymentBooking) return;
    setActionLoading(true);
    setPaymentNotice(null);
    try {
      const refreshedData = await listBookings({ status: undefined });
      const items = (refreshedData.items || []) as BookingItem[];
      const current = items.find((item) => item.id === selectedPaymentBooking.id);
      if (current && current.status === 'CONFIRMED') {
        setPaymentNotice({
          type: 'success',
          message: 'Thanh toán đã được ghi nhận thành công! Đơn đặt phòng đã được chuyển sang trạng thái ĐÃ XÁC NHẬN.',
        });
        setTimeout(() => {
          setSelectedPaymentBooking(null);
          setPaymentIntent(null);
          setPaymentNotice(null);
          reloadBookings();
        }, 1800);
      } else {
        setPaymentNotice({
          type: 'info',
          message: 'Hệ thống đang đối soát thanh toán chuyển khoản từ ngân hàng. Đơn phòng sẽ tự động chuyển sang Đã Xác Nhận ngay khi đối soát hoàn tất.',
        });
      }
    } catch (err: unknown) {
      setPaymentNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Không thể kiểm tra trạng thái thanh toán lúc này',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancellingBooking) return;
    setActionLoading(true);
    try {
      await updateBookingStatus(cancellingBooking.id, 'CANCELLED', 'Khách hàng chủ động hủy qua trang Kỳ nghỉ của tôi');
      alert('Đơn đặt phòng đã được hủy thành công.');
      setCancellingBooking(null);
      reloadBookings();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Hủy đơn thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendButlerMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!butlerMessage.trim()) return;
    setActionLoading(true);
    setTimeout(() => {
      setActionLoading(false);
      setIsButlerModalOpen(false);
      setButlerMessage('');
      alert('Yêu cầu đặc quyền của quý khách đã được gửi thành công đến Quản gia trưởng!');
    }, 600);
  };

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="w-full flex-1 min-h-[75vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 text-center shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-sans font-bold text-on-surface">Yêu Cầu Đăng Nhập</h2>
            <p className="text-xs text-outline mt-2 leading-relaxed">
              Quý khách vui lòng đăng nhập tài khoản để xem danh sách kỳ nghỉ và truy cập vé điện tử E-Voucher.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <UserMenu />
            <div className="text-xs text-outline pt-2">
              Hoặc tra cứu đơn không cần tài khoản:{' '}
              <Link href="/booking/lookup" className="text-primary font-bold hover:underline">
                Tra cứu khách vãng lai →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Derive active / upcoming hero booking
  const heroBooking = bookings.find((b) => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN') || bookings[0];
  const otherBookings = heroBooking ? bookings.filter((b) => b.id !== heroBooking.id) : [];
  const pendingCount = bookings.filter((b) => b.status === 'PENDING').length;

  return (
    <div className="w-full flex-1 bg-background py-8 lg:py-12 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1320px] mx-auto space-y-8">
        {/* Top Header & Guest Greeting */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/20 text-primary text-xs font-extrabold uppercase tracking-widest mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hội Viên Hoàng Kim • Gold Elite</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-sans font-black text-on-surface tracking-tight">
              Kỳ Nghỉ Của Quý Khách, {session.user?.name || 'Hoàng Kim'}
            </h1>
            <p className="text-xs sm:text-sm text-outline mt-1 max-w-2xl font-light">
              Theo dõi lịch trình nghỉ dưỡng, xuất vé điện tử E-Voucher nhận phòng sớm và yêu cầu dịch vụ quản gia may đo 24/7.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/register"
              className="px-4 py-2 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-outline-variant/30"
            >
              <Award className="w-4 h-4 text-primary" />
              <span>Đặc Quyền Hội Viên</span>
            </Link>
          </div>
        </div>

        {/* 4 Summary Metric Cards (KPI Strip) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1 */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-outline">
              <span className="text-[11px] font-bold uppercase tracking-wider">Kỳ nghỉ sắp tới</span>
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-on-surface">
                {heroBooking && heroBooking.status !== 'CANCELLED' ? '01 Kỳ nghỉ' : '0 Kỳ nghỉ'}
              </span>
              <p className="text-xs text-emerald-700 font-semibold mt-0.5">Đã lên lịch trình đón tiếp</p>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-outline">
              <span className="text-[11px] font-bold uppercase tracking-wider">Chờ hoàn tất</span>
              <Timer className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-on-surface">
                {String(pendingCount).padStart(2, '0')} Đơn đặt
              </span>
              <p className="text-xs text-amber-700 font-semibold mt-0.5">
                {pendingCount > 0 ? 'Cần hoàn tất chuyển khoản' : 'Không có khoản nợ'}
              </p>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-outline">
              <span className="text-[11px] font-bold uppercase tracking-wider">Dặm thưởng Elite</span>
              <Award className="w-4 h-4 text-primary" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-on-surface">14.850</span>
              <p className="text-xs text-outline mt-0.5">Hạng Gold Elite (+15% tích lũy)</p>
            </div>
          </div>

          {/* KPI 4 */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-outline">
              <span className="text-[11px] font-bold uppercase tracking-wider">E-Voucher độc quyền</span>
              <Ticket className="w-4 h-4 text-primary" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-on-surface">02 Phiếu</span>
              <p className="text-xs text-emerald-700 font-semibold mt-0.5">Spa &amp; Nâng cấp hạng phòng</p>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-inner overflow-x-auto max-w-full">
            {[
              { id: 'ALL' as const, label: `Tất cả (${bookings.length})` },
              { id: 'UPCOMING' as const, label: 'Sắp khởi hành' },
              { id: 'PENDING' as const, label: `Chờ thanh toán (${pendingCount})` },
              { id: 'COMPLETED' as const, label: 'Lịch sử lưu trú' },
              { id: 'CANCELLED' as const, label: 'Đã hủy' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-surface-container-lowest text-primary shadow-xs font-extrabold border border-outline-variant/30'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Link
            href="/booking/lookup"
            className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
          >
            <span>Tra cứu theo mã vãng lai</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-outline font-semibold">Đang cập nhật hành trình lưu trú...</p>
          </div>
        ) : error ? (
          <div className="p-8 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
            <p className="text-sm font-bold">{error}</p>
            <button
              type="button"
              onClick={reloadBookings}
              className="px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-bold cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-20 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-12 space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-surface-container flex items-center justify-center mx-auto text-outline">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-on-surface">Chưa Có Kỳ Nghỉ Nào Trong Mục Này</h3>
            <p className="text-xs text-outline max-w-md mx-auto">
              Quý khách chưa có đơn đặt phòng nào ở trạng thái này. Hãy khám phá các khu nghỉ dưỡng Quiet Luxury của chúng tôi.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-bold text-xs shadow hover:bg-primary-container hover:text-on-primary-container transition-all"
            >
              Khám Phá Resort &amp; Khách Sạn
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* SECTION 1: Active Upcoming Stay (Hero Booking Showcase) */}
            {heroBooking && (
              <div className="relative rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-md overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  {/* Visual Column */}
                  <div className="lg:col-span-5 relative min-h-[340px] lg:min-h-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80"
                      alt={heroBooking.property_name}
                      className="w-full h-full object-cover absolute inset-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40" />

                    <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                      <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-bold text-on-surface shadow-xs">
                        {heroBooking.property_name}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                          heroBooking.status === 'CONFIRMED'
                            ? 'bg-emerald-600 text-white'
                            : heroBooking.status === 'PENDING'
                            ? 'bg-amber-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {heroBooking.status === 'CONFIRMED'
                          ? '● Đã xác nhận phòng'
                          : heroBooking.status === 'PENDING'
                          ? '● Chờ thanh toán'
                          : heroBooking.status}
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 text-white flex justify-between items-end z-10">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-amber-200 font-bold">
                          Mã xác nhận PNR
                        </p>
                        <p className="text-xl font-sans font-black text-white tracking-wider">
                          #{heroBooking.booking_code}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedVoucherBooking(heroBooking)}
                        className="px-4 py-2 rounded-xl bg-white text-on-surface text-xs font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <QrCode className="w-4 h-4 text-primary" />
                        <span>Xem E-Voucher</span>
                      </button>
                    </div>
                  </div>

                  {/* Details & Operations Column */}
                  <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      {/* Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/20 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-surface-container text-outline text-[11px] font-bold uppercase">
                            Villa Biển Độc Lập
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-primary-container/20 text-primary text-[11px] font-extrabold uppercase">
                            2 Khách Lớn
                          </span>
                        </div>
                        <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Miễn phí hủy trước 48h</span>
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h2 className="text-2xl font-sans font-bold text-on-surface">
                          {heroBooking.room_type_name || 'Biệt Thự Hướng Biển Kèm Bể Bơi Riêng'}
                        </h2>
                        <p className="text-xs text-outline mt-1 leading-relaxed">
                          Tầm nhìn trực diện hoàng hôn vịnh biển riêng tư • Quản gia riêng phục vụ 24/7 • Bữa sáng Champagne mỗi ngày.
                        </p>
                      </div>

                      {/* Stay Specs Grid */}
                      <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 text-xs">
                        <div>
                          <span className="text-outline uppercase tracking-wider text-[10px] font-bold block">
                            Nhận phòng
                          </span>
                          <p className="font-bold text-on-surface mt-0.5">{heroBooking.check_in}</p>
                          <span className="text-[11px] text-primary font-semibold">Từ 14:00 (VIP 10:30)</span>
                        </div>
                        <div>
                          <span className="text-outline uppercase tracking-wider text-[10px] font-bold block">
                            Trả phòng
                          </span>
                          <p className="font-bold text-on-surface mt-0.5">{heroBooking.check_out}</p>
                          <span className="text-[11px] text-outline">Trước 12:00 trưa</span>
                        </div>
                        <div>
                          <span className="text-outline uppercase tracking-wider text-[10px] font-bold block">
                            Thời lượng
                          </span>
                          <p className="font-bold text-on-surface mt-0.5">{heroBooking.nights} Đêm lưu trú</p>
                          <span className="text-[11px] text-emerald-700 font-semibold">Gồm buffet sáng</span>
                        </div>
                      </div>

                      {/* Pre-booked Schedule & Itinerary Timeline */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-outline block">
                          Lịch trình đặc quyền gắn liền kỳ nghỉ:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-surface-container flex items-center gap-2.5">
                            <Car className="w-4 h-4 text-primary shrink-0" />
                            <div>
                              <p className="font-bold text-on-surface">09:15 - Đón xe riêng Cam Ranh</p>
                              <p className="text-[11px] text-outline">Maybach sang trọng đón tại sảnh A</p>
                            </div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-surface-container flex items-center gap-2.5">
                            <Clock className="w-4 h-4 text-primary shrink-0" />
                            <div>
                              <p className="font-bold text-on-surface">10:30 - Early Check-in đặc quyền</p>
                              <p className="text-[11px] text-outline">Welcome drink &amp; Tinh dầu hoa cúc</p>
                            </div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-surface-container flex items-center gap-2.5">
                            <Coffee className="w-4 h-4 text-primary shrink-0" />
                            <div>
                              <p className="font-bold text-on-surface">16:30 - Trà chiều bên mỏm đá</p>
                              <p className="text-[11px] text-outline">Bàn trà vọng hải Sunset Lounge riêng biệt</p>
                            </div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-surface-container flex items-center gap-2.5">
                            <UtensilsCrossed className="w-4 h-4 text-primary shrink-0" />
                            <div>
                              <p className="font-bold text-on-surface">19:30 - Michelin Tasting Menu</p>
                              <p className="text-[11px] text-outline">Bữa tối 6 món tại nhà hàng The Rocks</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons Dock */}
                    <div className="pt-4 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedVoucherBooking(heroBooking)}
                          className="px-5 py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>Xem E-Voucher &amp; QR Check-in</span>
                        </button>

                        <Link
                          href={`/my-bookings/${heroBooking.id}/modify`}
                          className="px-4 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all flex items-center gap-2 border border-outline-variant/30"
                        >
                          <Edit className="w-3.5 h-3.5 text-primary" />
                          <span>Điều Chỉnh Đặt Phòng</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            setButlerBookingTarget(heroBooking);
                            setIsButlerModalOpen(true);
                          }}
                          className="px-4 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all flex items-center gap-1.5 border border-outline-variant/30 cursor-pointer"
                        >
                          <Headphones className="w-3.5 h-3.5 text-primary" />
                          <span>Yêu Cầu Quản Gia</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {heroBooking.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => handleOpenPayment(heroBooking)}
                            className="px-4 py-2.5 rounded-full bg-amber-500 text-white hover:bg-amber-600 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Thanh Toán VietQR</span>
                          </button>
                        )}

                        {heroBooking.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => setCancellingBooking(heroBooking)}
                            className="px-4 py-2.5 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer"
                          >
                            Hủy Linh Hoạt
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: Other Bookings & History */}
            {otherBookings.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-sans font-bold text-on-surface">Các Đơn Đặt Phòng Khác</h3>
                    <p className="text-xs text-outline">
                      Lịch sử kỳ nghỉ và các đơn đang chờ xử lý thanh toán xác thực.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {otherBookings.map((b) => {
                    const isPending = b.status === 'PENDING';
                    const isConfirmed = b.status === 'CONFIRMED';
                    const isCancelled = b.status === 'CANCELLED';

                    return (
                      <div
                        key={b.id}
                        className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-primary bg-primary-container/20 px-2.5 py-0.5 rounded-full">
                              {b.booking_code}
                            </span>
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                isConfirmed
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isPending
                                  ? 'bg-amber-100 text-amber-800'
                                  : isCancelled
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-surface-container text-on-surface'
                              }`}
                            >
                              {isConfirmed && '● Đã Xác Nhận'}
                              {isPending && '● Chờ Thanh Toán'}
                              {isCancelled && '● Đã Hủy'}
                              {!isConfirmed && !isPending && !isCancelled && b.status}
                            </span>
                          </div>

                          <h4 className="text-lg font-sans font-bold text-on-surface">{b.property_name}</h4>
                          <div className="text-xs text-outline space-y-1">
                            <div>{b.room_type_name || 'Hạng phòng cao cấp'}</div>
                            <div>
                              {b.check_in} → {b.check_out} ({b.nights} đêm)
                            </div>
                            <div className="font-bold text-primary text-sm pt-1">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                                b.total_price
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedVoucherBooking(b)}
                            className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Vé E-Voucher</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/my-bookings/${b.id}/modify`}
                              className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-bold"
                            >
                              Chi tiết / Đổi lịch
                            </Link>

                            {isPending && (
                              <button
                                type="button"
                                onClick={() => handleOpenPayment(b)}
                                className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold cursor-pointer"
                              >
                                Thanh toán
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Concierge Assistance Strip */}
        <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-container/20 flex items-center justify-center shrink-0 text-primary">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold uppercase tracking-wider text-on-surface">
                Dịch Vụ Quản Gia &amp; Hỗ Trợ Lưu Trú 24/7
              </h4>
              <p className="text-xs text-outline mt-0.5">
                Mọi thay đổi giờ bay, thực đơn ăn kiêng hoặc đưa đón trực thăng đều được xử lý tức thời.
              </p>
            </div>
          </div>

          <a
            href="tel:+84288888LUXE"
            className="px-6 py-2.5 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high font-bold text-xs transition-colors shrink-0 flex items-center gap-2 border border-outline-variant/30"
          >
            <Phone className="w-3.5 h-3.5 text-primary" />
            <span>Gọi Concierge: +84 28 8888 LUXE</span>
          </a>
        </div>
      </div>

      {/* E-VOUCHER MODAL */}
      {selectedVoucherBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-outline-variant/40 relative my-8">
            <button
              type="button"
              onClick={() => setSelectedVoucherBooking(null)}
              className="absolute top-6 right-6 p-2 rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-4">
              <span className="text-xs uppercase tracking-widest text-primary font-bold">
                Vé Điện Tử Nghỉ Dưỡng
              </span>
              <h3 className="text-2xl font-sans font-bold text-on-surface">
                E-Voucher VIP Fast Check-in
              </h3>

              {/* QR Code Canvas */}
              <div className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant/40 inline-block mx-auto shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    `AURUM-VOUCHER:${selectedVoucherBooking.booking_code}:${selectedVoucherBooking.guest_name}`
                  )}`}
                  alt="Voucher QR Code"
                  className="w-44 h-44 rounded-xl mx-auto shadow-sm"
                />
                <div className="mt-3 font-mono text-lg font-black text-primary tracking-wider">
                  {selectedVoucherBooking.booking_code}
                </div>
                <div className="text-[11px] text-outline font-medium mt-0.5">
                  Mã PIN xác thực: 8899
                </div>
              </div>

              {/* Booking Voucher Facts */}
              <div className="text-left bg-surface-container p-5 rounded-2xl text-xs space-y-2.5 border border-outline-variant/20">
                <div className="flex justify-between">
                  <span className="text-outline">Cơ sở lưu trú:</span>
                  <span className="font-bold text-on-surface">{selectedVoucherBooking.property_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Hạng phòng:</span>
                  <span className="font-bold text-on-surface">{selectedVoucherBooking.room_type_name || 'Cao cấp'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Khách lưu trú:</span>
                  <span className="font-bold text-on-surface">{selectedVoucherBooking.guest_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Thời gian:</span>
                  <span className="font-bold text-on-surface">
                    {selectedVoucherBooking.check_in} → {selectedVoucherBooking.check_out} ({selectedVoucherBooking.nights} đêm)
                  </span>
                </div>
                <div className="flex justify-between border-t border-outline-variant/30 pt-2 font-bold">
                  <span className="text-outline">Trạng thái:</span>
                  <span className="text-emerald-700">{selectedVoucherBooking.status}</span>
                </div>
              </div>

              {/* Print / Actions */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 h-11 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>In Phiếu Vé (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVoucherBooking(null)}
                  className="flex-1 h-11 rounded-full bg-primary text-on-primary font-bold text-xs hover:bg-primary-container hover:text-on-primary-container transition-all cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <h3 className="text-xl font-bold text-on-surface">Yêu Cầu Quản Gia Riêng 24/7</h3>
              <p className="text-xs text-outline">
                {butlerBookingTarget?.property_name || 'Aurum Haven Resort'} • #{butlerBookingTarget?.booking_code}
              </p>
            </div>

            <form onSubmit={handleSendButlerMessage} className="space-y-4 pt-2">
              <textarea
                required
                rows={4}
                value={butlerMessage}
                onChange={(e) => setButlerMessage(e.target.value)}
                placeholder="Ví dụ: Chuẩn bị 2 gối lông ngỗng bổ sung, xe đưa đón sân bay lúc 10:00 sáng mai..."
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

      {/* VIETQR PAYMENT MODAL */}
      {selectedPaymentBooking && paymentIntent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-outline-variant/40 relative my-8 space-y-6">
            <button
              type="button"
              onClick={() => {
                setSelectedPaymentBooking(null);
                setPaymentIntent(null);
                setPaymentNotice(null);
              }}
              className="absolute top-6 right-6 p-2 rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-primary">
                Cổng Thanh Toán Napas 247
              </span>
              <h3 className="text-2xl font-sans font-bold text-on-surface">
                Thanh Toán Chuyển Khoản VietQR
              </h3>
              <p className="text-xs text-outline">
                Quét mã QR qua ứng dụng ngân hàng bất kỳ để thanh toán tức thì
              </p>
            </div>

            {/* QR Image Box */}
            <div className="p-4 rounded-3xl bg-surface-container-low border border-outline-variant/40 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={paymentIntent.qr_code_url}
                alt="VietQR code"
                className="w-52 h-52 object-contain mx-auto rounded-xl shadow-sm bg-white p-2"
              />
              <div className="mt-3 text-2xl font-black text-primary">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(paymentIntent.amount)}
              </div>
            </div>

            {/* Bank Transfer Details */}
            <div className="bg-surface-container p-5 rounded-2xl text-xs space-y-2.5 border border-outline-variant/20">
              <div className="flex justify-between">
                <span className="text-outline">Ngân hàng thụ hưởng:</span>
                <span className="font-bold text-on-surface">{paymentIntent.bank_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Số tài khoản:</span>
                <span className="font-bold text-on-surface font-mono">{paymentIntent.account_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Chủ tài khoản:</span>
                <span className="font-bold text-on-surface">{paymentIntent.account_holder}</span>
              </div>
              <div className="flex justify-between border-t border-outline-variant/30 pt-2 items-center">
                <span className="text-outline">Nội dung chuyển khoản:</span>
                <div className="flex items-center gap-1 font-mono font-bold text-primary text-sm bg-primary-container/20 px-2 py-0.5 rounded">
                  <span>{paymentIntent.transfer_content}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(paymentIntent.transfer_content);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-1 hover:text-on-surface cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Status Check / Refresh button */}
            <div className="space-y-3 pt-2">
              {paymentNotice && (
                <div
                  className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 ${
                    paymentNotice.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : paymentNotice.type === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  {paymentNotice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{paymentNotice.message}</span>
                </div>
              )}

              <button
                type="button"
                disabled={actionLoading}
                onClick={handleCheckPaymentStatus}
                className="w-full h-12 rounded-full bg-primary text-on-primary font-bold text-sm hover:bg-primary-container hover:text-on-primary-container transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang kiểm tra đối soát...</span>
                  </>
                ) : (
                  <span>Kiểm Tra Trạng Thái Thanh Toán</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedPaymentBooking(null);
                  setPaymentIntent(null);
                  setPaymentNotice(null);
                }}
                className="w-full text-xs text-outline hover:text-on-surface font-semibold py-1 cursor-pointer"
              >
                Để tôi thanh toán sau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL CONFIRMATION MODAL */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-7 border border-outline-variant/40 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-on-surface">Xác Nhận Hủy Đơn Đặt Phòng?</h3>
              <p className="text-xs text-outline leading-relaxed">
                Quý khách có chắc chắn muốn hủy đơn đặt phòng <strong>{cancellingBooking.booking_code}</strong> tại{' '}
                <strong>{cancellingBooking.property_name}</strong> không?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                className="flex-1 h-11 rounded-full bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Không, giữ phòng
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleCancelBooking}
                className="flex-1 h-11 rounded-full bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

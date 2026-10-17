'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Printer,
  QrCode,
  ShieldAlert,
  MapPin,
  CreditCard,
  User,
  Phone,
  Mail,
  X,
} from 'lucide-react';
import {
  getBooking,
  updateBookingStatus,
  createPaymentIntent,
} from '@/features/bookings/service/bookings.client';
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
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | string;
  payment_status?: 'UNPAID' | 'PAID' | 'REFUNDED' | string;
  special_requests?: string | null;
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

function BookingDetailContent() {
  const routeParams = useParams();
  const id = typeof routeParams?.id === 'string' ? routeParams.id : '';
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const [booking, setBooking] = useState<BookingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment intent state
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentData | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  // Modals state
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!id) return;
    setLoading(true);

    getBooking(id)
      .then((data) => {
        if (!isMounted) return;
        const b = data as BookingItem;
        setBooking(b);
        setLoading(false);

        // Fetch payment intent if pending or unpaid
        if (b.status === 'PENDING' || b.payment_status === 'UNPAID') {
          createPaymentIntent(b.id, 'VIETQR')
            .then((intent) => {
              if (isMounted) setPaymentIntent(intent as PaymentIntentData);
            })
            .catch(() => {});
        }
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

  const handleCheckPaymentStatus = async () => {
    if (!booking) return;
    setPaymentLoading(true);
    setPaymentNotice(null);
    try {
      const refreshed = (await getBooking(booking.id)) as BookingItem;
      setBooking(refreshed);
      if (refreshed.payment_status === 'PAID' || refreshed.status === 'CONFIRMED') {
        setPaymentNotice({
          type: 'success',
          message: 'Thanh toán đã được ghi nhận thành công! Đơn đặt phòng đã được xác nhận.',
        });
      } else {
        setPaymentNotice({
          type: 'info',
          message: 'Hệ thống đang chờ đối soát chuyển khoản ngân hàng. Đơn phòng sẽ tự động xác nhận ngay khi ghi nhận giao dịch.',
        });
      }
    } catch (err: unknown) {
      setPaymentNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Không thể kiểm tra đối soát lúc này',
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    setActionLoading(true);
    try {
      await updateBookingStatus(booking.id, 'CANCELLED', 'Khách hàng hủy qua trang quản lý');
      setIsCancelConfirmOpen(false);
      const refreshed = (await getBooking(booking.id)) as BookingItem;
      setBooking(refreshed);
      alert('Đơn đặt phòng đã được hủy thành công.');
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

  const isConfirmed = booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN';
  const isPending = booking.status === 'PENDING';
  const isCancelled = booking.status === 'CANCELLED';

  return (
    <div className="min-h-screen bg-background py-8 lg:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1140px] mx-auto space-y-6">
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
              onClick={() => setIsVoucherModalOpen(true)}
              className="px-4 py-2 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs border border-outline-variant/30"
            >
              <QrCode className="w-4 h-4 text-primary" />
              <span>Xem Vé E-Voucher</span>
            </button>
            {isPending && (
              <button
                type="button"
                onClick={() => setIsCancelConfirmOpen(true)}
                className="px-4 py-2 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer"
              >
                Hủy Đơn Đặt Phòng
              </button>
            )}
          </div>
        </div>

        {/* Hero Card with Booking Details */}
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-md p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-extrabold text-primary bg-primary-container/20 px-3 py-0.5 rounded-full">
                {booking.booking_code}
              </span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  isConfirmed
                    ? 'bg-emerald-100 text-emerald-800'
                    : isPending
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                ● {isConfirmed ? 'Đã Xác Nhận' : isPending ? 'Chờ Thanh Toán' : 'Đã Hủy'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-sans font-extrabold text-on-surface tracking-tight">
              {booking.property_name}
            </h1>
            <p className="text-xs text-outline flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{booking.property_address || 'Khu nghỉ dưỡng cao cấp'}</span>
            </p>
          </div>

          <div className="text-left lg:text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">Tổng Tiền Thanh Toán</span>
            <div className="text-2xl sm:text-3xl font-black text-primary">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.total_price)}
            </div>
            <span className="text-xs text-emerald-700 font-semibold">
              {booking.payment_status === 'PAID' ? '✓ Đã thanh toán đủ' : 'Chưa thanh toán'}
            </span>
          </div>
        </div>

        {/* 2-Column Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT 7 COLS: Booking Info */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-6 sm:p-8 shadow-sm space-y-6">
              <h3 className="text-lg font-sans font-bold text-on-surface border-b border-outline-variant/20 pb-3">
                Thông Tin Chi Tiết Lưu Trú
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1">
                  <span className="text-outline font-semibold">Hạng phòng</span>
                  <div className="font-bold text-base text-on-surface">{booking.room_type_name || 'Phòng nghỉ dưỡng'}</div>
                  <div className="text-outline text-[11px]">{booking.nights} đêm lưu trú</div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1">
                  <span className="text-outline font-semibold">Thời gian nhận - trả phòng</span>
                  <div className="font-bold text-base text-on-surface">{booking.check_in} → {booking.check_out}</div>
                  <div className="text-outline text-[11px]">Check-in 14:00 • Check-out 12:00</div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1">
                  <span className="text-outline font-semibold">Khách đại diện</span>
                  <div className="font-bold text-base text-on-surface flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span>{booking.guest_name}</span>
                  </div>
                  <div className="text-outline text-[11px]">{booking.guest_phone}</div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1">
                  <span className="text-outline font-semibold">Email liên hệ</span>
                  <div className="font-bold text-base text-on-surface flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-primary" />
                    <span className="truncate">{booking.guest_email}</span>
                  </div>
                  <div className="text-outline text-[11px]">Đã gửi xác nhận điện tử</div>
                </div>
              </div>

              {booking.special_requests && (
                <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-1 text-xs">
                  <span className="text-outline font-bold uppercase tracking-wider text-[10px]">
                    Yêu cầu đặc biệt của khách hàng:
                  </span>
                  <p className="text-on-surface leading-relaxed">{booking.special_requests}</p>
                </div>
              )}

              {/* Policies info */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 text-xs text-outline space-y-2">
                <div className="flex items-center gap-2 font-bold text-on-surface">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Quy định nhận phòng &amp; hủy phòng</span>
                </div>
                <p className="leading-relaxed">
                  Quý khách vui lòng xuất trình CCCD/Hộ chiếu trùng khớp tên khách đại diện khi làm thủ tục tại sảnh đón. Đơn phòng hỗ trợ hủy linh hoạt trước 48 giờ so với giờ nhận phòng tiêu chuẩn.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: Payment (VietQR) or Status Summary */}
          <div className="lg:col-span-5 space-y-6">
            {isPending && paymentIntent ? (
              <div className="bg-surface-container-lowest rounded-3xl border border-primary/40 p-6 sm:p-7 shadow-lg space-y-5">
                <div className="text-center space-y-1">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-primary">
                    Cổng Thanh Toán Napas 247
                  </span>
                  <h3 className="text-lg font-sans font-bold text-on-surface">
                    Chuyển Khoản Ngân Hàng VietQR
                  </h3>
                  <p className="text-xs text-outline">
                    Quét mã QR để hoàn tất thanh toán tức thì
                  </p>
                </div>

                <div className="text-center">
                  <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/40 inline-block shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={paymentIntent.qr_code_url}
                      alt="VietQR code"
                      className="w-48 h-48 object-contain mx-auto rounded-xl bg-white p-2 shadow-sm"
                    />
                  </div>
                </div>

                <div className="bg-surface-container p-4 rounded-2xl text-xs space-y-2.5 border border-outline-variant/20">
                  <div className="flex justify-between">
                    <span className="text-outline">Ngân hàng:</span>
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
                  <div className="flex justify-between">
                    <span className="text-outline">Số tiền:</span>
                    <span className="font-black text-base text-primary">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(paymentIntent.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-outline-variant/30 pt-2 items-center">
                    <span className="text-outline">Cú pháp chuyển khoản:</span>
                    <div className="flex items-center gap-1 font-mono font-bold text-primary text-xs bg-primary-container/20 px-2 py-0.5 rounded">
                      <span>{paymentIntent.transfer_content}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(paymentIntent.transfer_content);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="p-1 hover:text-on-surface cursor-pointer"
                        title="Sao chép cú pháp"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {paymentNotice && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
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
                  disabled={paymentLoading}
                  onClick={handleCheckPaymentStatus}
                  className="w-full h-11 rounded-full bg-primary text-on-primary font-bold text-xs hover:bg-primary-container hover:text-on-primary-container transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {paymentLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang kiểm tra đối soát...</span>
                    </>
                  ) : (
                    <span>Kiểm Tra Trạng Thái Thanh Toán</span>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-6 sm:p-7 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-on-surface">Trạng Thái Đơn Hàng</h4>
                    <p className="text-xs text-outline">
                      {isConfirmed ? 'Đã thanh toán & xác nhận giữ chỗ' : isCancelled ? 'Đơn đặt phòng đã bị hủy' : 'Đang xử lý'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low text-xs space-y-2 border border-outline-variant/20">
                  <div className="flex justify-between">
                    <span className="text-outline">Mã đặt phòng:</span>
                    <span className="font-mono font-bold text-primary">{booking.booking_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Trạng thái thanh toán:</span>
                    <span className="font-bold text-emerald-700">
                      {booking.payment_status === 'PAID' ? 'Đã Thanh Toán' : 'Đã Hủy / Hoàn Tiền'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(true)}
                  className="w-full h-11 rounded-full bg-primary text-on-primary font-bold text-xs hover:bg-primary-container hover:text-on-primary-container transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Xuất Vé Điện Tử E-Voucher</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* E-VOUCHER MODAL */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-outline-variant/40 relative my-8">
            <button
              type="button"
              onClick={() => setIsVoucherModalOpen(null as unknown as boolean)}
              className="absolute top-6 right-6 p-2 rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-4">
              <span className="text-xs uppercase tracking-widest text-primary font-bold">
                Vé Điện Tử Nghỉ Dưỡng
              </span>
              <h3 className="text-2xl font-sans font-bold text-on-surface">
                E-Voucher Nhận Phòng Trực Tuyến
              </h3>

              <div className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant/40 inline-block mx-auto shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    `VIETSAGE-VOUCHER:${booking.booking_code}:${booking.guest_name}`
                  )}`}
                  alt="Voucher QR Code"
                  className="w-44 h-44 rounded-xl mx-auto shadow-sm"
                />
                <div className="mt-3 font-mono text-lg font-black text-primary tracking-wider">
                  {booking.booking_code}
                </div>
                <div className="text-[11px] text-outline font-medium mt-0.5">
                  Mã xác thực lưu trú chính thức
                </div>
              </div>

              <div className="text-left bg-surface-container p-5 rounded-2xl text-xs space-y-2.5 border border-outline-variant/20">
                <div className="flex justify-between">
                  <span className="text-outline">Cơ sở lưu trú:</span>
                  <span className="font-bold text-on-surface">{booking.property_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Hạng phòng:</span>
                  <span className="font-bold text-on-surface">{booking.room_type_name || 'Tiêu chuẩn'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Khách đại diện:</span>
                  <span className="font-bold text-on-surface">{booking.guest_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Thời gian:</span>
                  <span className="font-bold text-on-surface">
                    {booking.check_in} → {booking.check_out} ({booking.nights} đêm)
                  </span>
                </div>
                <div className="flex justify-between border-t border-outline-variant/30 pt-2 font-bold">
                  <span className="text-outline">Trạng thái:</span>
                  <span className="text-emerald-700">{booking.status}</span>
                </div>
              </div>

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
                  onClick={() => setIsVoucherModalOpen(false)}
                  className="flex-1 h-11 rounded-full bg-primary text-on-primary font-bold text-xs hover:bg-primary-container hover:text-on-primary-container transition-all cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL CONFIRMATION MODAL */}
      {isCancelConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-7 border border-outline-variant/40 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-on-surface">Xác Nhận Hủy Đơn Đặt Phòng?</h3>
              <p className="text-xs text-outline leading-relaxed">
                Quý khách có chắc chắn muốn hủy đơn đặt phòng <strong>{booking.booking_code}</strong> tại{' '}
                <strong>{booking.property_name}</strong> không?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsCancelConfirmOpen(false)}
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

export default function BookingDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BookingDetailContent />
    </Suspense>
  );
}

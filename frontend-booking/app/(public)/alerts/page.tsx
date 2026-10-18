'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Layers,
} from 'lucide-react';
import { luxuryAlert } from '@/lib/alert/luxury-alert';
import { LuxuryAlertBanner } from '@/components/shared/luxury-alert-banner';

export default function AlertsShowcasePage() {
  const [showInlineVip, setShowInlineVip] = useState(true);
  const [showInlineSuccess, setShowInlineSuccess] = useState(true);
  const [showInlineWarning, setShowInlineWarning] = useState(true);
  const [showInlineError, setShowInlineError] = useState(true);
  const [showInlineInfo, setShowInlineInfo] = useState(true);

  // Trigger test for the exact screenshot scenario
  const handleTestBookingErrorAlert = () => {
    luxuryAlert.error({
      title: 'Thông Tin Đặt Phòng Cần Điều Chỉnh',
      message: 'Hệ thống nhận thấy thông tin lưu trú chưa hoàn toàn khớp với lịch công suất phòng thực tế. Quý khách vui lòng kiểm tra lại ngày nhận phòng và thông tin liên hệ.',
      details: [
        'Khoảng thời gian: 01/11/2026 → 03/11/2026 (2 đêm)',
        'Số điện thoại người liên hệ: 03439213331',
        'Lưu ý: Quý khách vui lòng chọn phòng còn trống và kiểm tra hạn giữ chỗ',
      ],
      confirmText: 'Đã Hiểu & Kiểm Tra Lại',
    });
  };

  const handleTestConfirmDialog = async () => {
    const confirmed = await luxuryAlert.confirm({
      title: 'Xác Nhận Hủy Kỳ Nghỉ?',
      message: 'Đơn phòng OTA-202610-8839 áp dụng chính sách miễn phí hủy trước 48 giờ. Toàn bộ tiền cọc sẽ được hoàn lại vào tài khoản ban đầu trong 3-5 ngày làm việc.',
      confirmText: 'Xác Nhận Hủy Phòng',
      cancelText: 'Giữ Lại Đặt Phòng',
      isDangerous: true,
    });

    if (confirmed) {
      luxuryAlert.toast('Đã tiếp nhận yêu cầu hủy phòng thành công', 'success');
    } else {
      luxuryAlert.toast('Đã giữ lại kỳ nghỉ của quý khách', 'info');
    }
  };

  const handleTestSuccessDialog = () => {
    luxuryAlert.success({
      title: 'Tiếp Nhận Đặt Phòng Thành Công',
      message: 'Hệ thống đã khóa giữ phòng Biệt thự Biển lúc hoàng hôn trong 30 phút. Mã đặt phòng OTA-202610-7712 đã được gửi về email của bạn.',
      confirmText: 'Xem Đơn Đặt Chỗ',
    });
  };

  const handleTestPrivilegeDialog = () => {
    luxuryAlert.info({
      title: 'Đặc Quyền Hội Viên Vàng (Gold Member)',
      message: 'Quý khách được tặng kèm 01 chai Champagne Ruinart Brut ướp lạnh tại biệt thự và quyền lợi Trả phòng trễ đến 16:00 hoàn toàn miễn phí.',
      confirmText: 'Kích Hoạt Đặc Quyền',
    });
  };

  return (
    <div className="min-h-screen bg-background text-on-surface py-12 px-4 sm:px-6 lg:px-12">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Navigation & Header */}
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-outline hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Trang chủ</span>
          </Link>

          <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/30 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/20 border border-primary/20 text-primary text-xs uppercase tracking-widest font-extrabold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>VietSage Booking UI Standard</span>
              </div>
              <h1 className="font-sans text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">
                Hệ Thống Alert &amp; Notification
              </h1>
              <p className="text-base text-outline max-w-xl leading-relaxed">
                Hệ thống thông báo và cảnh báo chuẩn mực, giao diện thanh lịch và thân thiện chuẩn trải nghiệm nghỉ dưỡng.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                Tiêu Chuẩn Đồng Bộ UI
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 1: Modals & Dialogs */}
        <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">1. Hộp Thoại Modal Thông Báo &amp; Cảnh Báo</h2>
              <p className="text-xs text-outline">
                Hộp thoại cảnh báo và xác nhận thao tác quan trọng dành cho khách hàng và quản trị viên
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Booking Error Dialog */}
            <div className="p-5 rounded-2xl bg-surface-container-low border border-rose-200/60 space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-rose-700 bg-rose-100/80 px-2.5 py-0.5 rounded-full">
                  Cảnh Báo Thông Tin
                </span>
                <h3 className="font-bold text-base text-on-surface mt-2">Cảnh Báo Lỗi Đặt Phòng</h3>
                <p className="text-xs text-outline mt-1 leading-relaxed">
                  Thông báo chi tiết và hướng dẫn khách hàng điều chỉnh thông tin ngày lưu trú và số liên hệ hợp lệ.
                </p>
              </div>
              <button
                type="button"
                onClick={handleTestBookingErrorAlert}
                className="w-full py-3 px-4 rounded-full bg-rose-700 text-white text-xs font-bold uppercase tracking-wider hover:bg-rose-800 transition-all shadow-sm cursor-pointer"
              >
                Kích Hoạt Alert Lỗi Đặt Phòng
              </button>
            </div>

            {/* Confirm Dialog */}
            <div className="p-5 rounded-2xl bg-surface-container-low border border-amber-200/60 space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
                  Xác Nhận Thao Tác
                </span>
                <h3 className="font-bold text-base text-on-surface mt-2">Hộp Thoại Xác Nhận Hủy Phòng</h3>
                <p className="text-xs text-outline mt-1 leading-relaxed">
                  Hỏi ý kiến khách hàng hoặc quản trị viên với nút bấm xác nhận/hủy bỏ sang trọng.
                </p>
              </div>
              <button
                type="button"
                onClick={handleTestConfirmDialog}
                className="w-full py-3 px-4 rounded-full bg-amber-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-amber-950 transition-all shadow-sm cursor-pointer"
              >
                Kích Hoạt Xác Nhận Hủy
              </button>
            </div>

            {/* Success Dialog */}
            <div className="p-5 rounded-2xl bg-surface-container-low border border-emerald-200/60 space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                  Thành Công
                </span>
                <h3 className="font-bold text-base text-on-surface mt-2">Xác Nhận Giữ Chỗ 5 Sao</h3>
                <p className="text-xs text-outline mt-1 leading-relaxed">
                  Hiển thị mã hồ sơ đặt phòng, thời gian giữ chỗ 30 phút và thông tin thanh toán.
                </p>
              </div>
              <button
                type="button"
                onClick={handleTestSuccessDialog}
                className="w-full py-3 px-4 rounded-full bg-primary text-on-primary text-xs font-bold uppercase tracking-wider hover:bg-primary-container hover:text-on-primary-container transition-all shadow-sm cursor-pointer"
              >
                Kích Hoạt Alert Thành Công
              </button>
            </div>

            {/* Privilege Dialog */}
            <div className="p-5 rounded-2xl bg-surface-container-low border border-[#c5a880]/40 space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#725b38] bg-[#fedeb2] px-2.5 py-0.5 rounded-full">
                  VIP Privilege
                </span>
                <h3 className="font-bold text-base text-on-surface mt-2">Thông Báo Đặc Quyền Gold</h3>
                <p className="text-xs text-outline mt-1 leading-relaxed">
                  Hộp thoại vinh danh hội viên cao cấp tặng Champagne và miễn phí trả phòng muộn.
                </p>
              </div>
              <button
                type="button"
                onClick={handleTestPrivilegeDialog}
                className="w-full py-3 px-4 rounded-full bg-[#725b38] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#c5a880] hover:text-[#1a1c1a] transition-all shadow-sm cursor-pointer"
              >
                Kích Hoạt Đặc Quyền VIP
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 2: Floating Toasts */}
        <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">2. Floating Toast Notifications (Thông Báo Nổi Góc Màn Hình)</h2>
              <p className="text-xs text-outline">
                Thông báo nhanh không cản trở thao tác với thanh đếm giờ tự động biến mất
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => luxuryAlert.toast('Đã thêm phòng nghỉ vào danh sách yêu thích!', 'luxury')}
              className="py-3 px-3 rounded-2xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all text-center border border-slate-700 cursor-pointer"
            >
              Toast Luxury
            </button>
            <button
              type="button"
              onClick={() => luxuryAlert.toast('Đã lưu thông tin xác nhận thanh toán thành công!', 'success')}
              className="py-3 px-3 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-all text-center border border-emerald-200 cursor-pointer"
            >
              Toast Success
            </button>
            <button
              type="button"
              onClick={() => luxuryAlert.toast('Chỉ còn 1 phòng duy nhất cho kỳ nghỉ của bạn!', 'warning')}
              className="py-3 px-3 rounded-2xl bg-amber-50 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-all text-center border border-amber-200 cursor-pointer"
            >
              Toast Warning
            </button>
            <button
              type="button"
              onClick={() => luxuryAlert.toast('Không thể kết nối ngân hàng đối soát lúc này.', 'error')}
              className="py-3 px-3 rounded-2xl bg-rose-50 text-rose-800 text-xs font-bold hover:bg-rose-100 transition-all text-center border border-rose-200 cursor-pointer"
            >
              Toast Error
            </button>
          </div>
        </section>

        {/* SECTION 3: Inline Banners */}
        <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-on-surface">3. Inline Alert Banners (Thông Báo Nội Tuyến)</h2>
                <p className="text-xs text-outline">
                  Thành phần React dùng trong các biểu mẫu đặt phòng, đăng nhập và trang quản trị
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowInlineVip(true);
                setShowInlineSuccess(true);
                setShowInlineWarning(true);
                setShowInlineError(true);
                setShowInlineInfo(true);
              }}
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              Hiện lại tất cả
            </button>
          </div>

          <div className="space-y-4">
            {/* VIP Privilege Banner */}
            {showInlineVip && (
              <LuxuryAlertBanner
                variant="privilege"
                title="Đặc quyền Hội viên Vàng (Gold Member)"
                badgeText="Tự động áp dụng"
                description="Quý khách được tặng kèm 01 chai Champagne Ruinart Brut ướp lạnh tại biệt thự và hưởng quyền lợi Trả phòng trễ đến 16:00 không phụ thu."
                onClose={() => setShowInlineVip(false)}
              />
            )}

            {/* Success Banner */}
            {showInlineSuccess && (
              <LuxuryAlertBanner
                variant="success"
                title="Xác Nhận Giữ Phòng Thành Công"
                code="OTA-202610-7712"
                description="Hệ thống đã khóa giữ phòng Biệt thự Biển lúc hoàng hôn trong 30 phút. Thông tin đơn đã được gửi về email của quý khách."
                actionText="Chi Tiết Đơn"
                onAction={() => luxuryAlert.toast('Đang mở chi tiết đơn đặt...', 'info')}
                onClose={() => setShowInlineSuccess(false)}
              />
            )}

            {/* Warning Banner */}
            {showInlineWarning && (
              <LuxuryAlertBanner
                variant="warning"
                title="Số Lượng Phòng Còn Lại Rất Ít"
                badgeText="Chỉ còn 1 phòng"
                description="Giai đoạn nghỉ dưỡng này hiện có 4 khách VIP khác cũng đang theo dõi. Đặt ngay để bảo toàn mức giá ưu đãi tốt nhất."
                actionText="Giữ Ngay"
                onAction={() => luxuryAlert.toast('Đang điều hướng đến bước chọn phòng...', 'warning')}
                onClose={() => setShowInlineWarning(false)}
              />
            )}

            {/* Error Banner */}
            {showInlineError && (
              <LuxuryAlertBanner
                variant="error"
                title="Giao Dịch VietQR Chưa Được Ghi Nhận"
                description="Hệ thống ngân hàng chưa hoàn tất đối soát mã giao dịch. Quý khách vui lòng kiểm tra lại nội dung chuyển khoản hoặc liên hệ trực tiếp Quản gia trực 24/7."
                actionText="Thử Lại"
                onAction={() => luxuryAlert.toast('Đang kích hoạt đối soát tự động...', 'info')}
                onClose={() => setShowInlineError(false)}
              />
            )}

            {/* Info Banner */}
            {showInlineInfo && (
              <LuxuryAlertBanner
                variant="info"
                title="Lưu Ý Về Thủ Tục Nhận Phòng (Fast Check-in)"
                description="Quý khách có thể tải trước căn cước công dân hoặc hộ chiếu lên hồ sơ cá nhân để nhận phòng không cần chờ đợi tại quầy lễ tân."
                onClose={() => setShowInlineInfo(false)}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

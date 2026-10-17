'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  User,
  KeyRound,
  ShieldCheck,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
  Building2,
  Compass,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { luxuryAlert } from '@/lib/alert/luxury-alert';
import { LuxuryAlertBanner } from '@/components/shared/luxury-alert-banner';

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/admin';
  const errorParam = searchParams.get('error');

  const { status } = useSession();

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Status state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam === 'forbidden'
      ? 'Tài khoản của bạn không có quyền truy cập khu vực Quản trị & Đối tác.'
      : null
  );

  // If already authenticated, redirect to admin or destination callbackUrl
  useEffect(() => {
    if (status === 'authenticated') {
      const destination = callbackUrl || '/admin';
      const postLoginUrl = `/api/auth/post-login?callbackUrl=${encodeURIComponent(destination)}`;
      window.location.assign(postLoginUrl);
    }
  }, [status, callbackUrl]);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await signIn('credentials', {
        username: loginUsername.trim(),
        password: loginPassword.trim(),
        redirect: false,
      });

      if (res?.error) {
        setErrorMessage('Thông tin đăng nhập không chính xác hoặc tài khoản không có quyền truy cập.');
      } else {
        const destination = callbackUrl || '/admin';
        const postLoginUrl = `/api/auth/post-login?callbackUrl=${encodeURIComponent(destination)}`;
        window.location.assign(postLoginUrl);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối cổng đăng nhập.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-background py-8 lg:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1280px] mx-auto">
        {/* Top Navigation Strip */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-outline hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Trang chủ</span>
          </Link>

          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-surface-container-high/70 border border-outline-variant/30 text-[11px] sm:text-xs font-semibold text-on-surface">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            <span className="hidden sm:inline">Cổng Quản Trị Bảo Mật VietSage 2026</span>
            <span className="sm:hidden">Bảo mật SSL</span>
          </div>
        </div>

        {/* Master Asymmetric Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* LEFT COLUMN: Editorial Showcase for Partners & Management */}
          <div className="lg:col-span-5 hidden lg:flex flex-col justify-between rounded-3xl overflow-hidden relative shadow-xl min-h-[640px] p-8 lg:p-10 border border-outline-variant/30 isolate">
            {/* Background Image */}
            <img
              src="/images/login-showcase.jpg"
              alt="VietSage Management & Partner Portal"
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
            {/* Cinematic Gradient Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/65 to-black/40 z-10 pointer-events-none" />

            {/* Top Brand Tag */}
            <div className="relative z-20 flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface/90 backdrop-blur-md shadow-sm w-fit">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-on-surface">
                  VietSage Partner Portal
                </span>
              </div>
              <span className="text-xs uppercase tracking-widest text-primary-fixed font-bold">
                Hệ Thống Quản Trị &amp; Hợp Tác Khách Sạn
              </span>
            </div>

            {/* Bottom Content: Operational Capabilities */}
            <div className="relative z-20 flex flex-col gap-5 text-white">
              <div>
                <p className="text-xs uppercase tracking-widest text-amber-200 font-bold mb-1.5">
                  Vận Hành Tập Trung
                </p>
                <h2 className="text-3xl font-extrabold text-white leading-tight">
                  Quản Trị Tồn Kho <br />
                  <span className="font-sans italic font-bold text-primary-fixed">
                    &amp; Phân Bổ Buồng Phòng
                  </span>
                </h2>
                <p className="text-xs text-slate-200/85 mt-2 leading-relaxed">
                  Cổng kết nối vận hành thời gian thực dành cho Quản trị viên và Đối tác khách sạn trên toàn hệ sinh thái VietSage OTA &amp; PMS.
                </p>
              </div>

              {/* 3 Value Pillars */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-primary-container/30 flex items-center justify-center shrink-0 text-amber-200">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white tracking-wide">
                      Quản Lý Allotments &amp; Giá Động
                    </span>
                    <span className="text-[11px] text-slate-300 truncate">
                      Cập nhật phòng trống, mức giá ưu đãi và biểu phí linh hoạt
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-primary-container/30 flex items-center justify-center shrink-0 text-amber-200">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white tracking-wide">
                      Đồng Bộ PMS VietSage Chuẩn Xác
                    </span>
                    <span className="text-[11px] text-slate-300 truncate">
                      Tự động hóa đối soát thông tin đặt phòng qua cổng kết nối bảo mật
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-primary-container/30 flex items-center justify-center shrink-0 text-amber-200">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white tracking-wide">
                      Phân Quyền Vận Hành Chặt Chẽ
                    </span>
                    <span className="text-[11px] text-slate-300 truncate">
                      Quản lý chi tiết theo vai trò Super Admin, Admin và Đối tác khách sạn
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Quote */}
              <div className="pt-2 flex items-center justify-between text-slate-300 text-xs border-t border-white/10">
                <span>Nền tảng Quản trị Chuỗi Nghỉ dưỡng</span>
                <span className="text-amber-200 font-bold uppercase tracking-wider text-[11px]">
                  VietSage Hospitality
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Dedicated Partner & Staff Login Form */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-xl p-6 sm:p-10 lg:p-12">
              {/* Header */}
              <div className="flex flex-col gap-1 mb-8">
                <div className="inline-flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <Compass className="w-4 h-4" />
                  <span>Cổng Dành Cho Cán Bộ &amp; Đối Tác</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
                  Đăng Nhập Quản Trị &amp; Đối Tác Khách Sạn
                </h1>
                <p className="text-xs sm:text-base text-outline mt-0.5">
                  Dành riêng cho Quản trị viên hệ thống VietSage và các Đối tác vận hành khách sạn, resort.
                </p>
              </div>

              {/* Status Alerts */}
              {errorMessage && (
                <LuxuryAlertBanner
                  variant="error"
                  description={errorMessage}
                  onClose={() => setErrorMessage(null)}
                  className="mb-6"
                />
              )}

              {/* LOGIN FORM */}
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
                    Tên Đăng Nhập Hoặc Email Công Tác
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-outline absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="Nhập tên đăng nhập quản trị hoặc đối tác..."
                      className="w-full pl-11 pr-4 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/20 focus:border-primary text-base font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-outline">
                      Mật Khẩu Bảo Mật
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        luxuryAlert.info({
                          title: 'Hỗ Trợ Khôi Phục Mật Khẩu Đối Tác',
                          message: 'Đối tác và cán bộ quản trị vui lòng liên hệ Bộ phận Vận hành Hệ thống VietSage qua hotline kỹ thuật hoặc hòm thư support@vietsage.vn để được cấp lại chứng chỉ truy cập.',
                          confirmText: 'Đã Tiếp Nhận',
                        })
                      }
                      className="text-xs text-primary font-bold hover:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-outline absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-11 pr-12 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/20 focus:border-primary text-base font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors cursor-pointer"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3.5 rounded-full bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-extrabold text-base tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang xác thực thông tin...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Đăng Nhập Cổng Quản Trị</span>
                    </>
                  )}
                </button>
              </form>

              {/* Guest Self-Service Redirect Box */}
              <div className="mt-8 pt-6 border-t border-outline-variant/20">
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-on-surface">
                      Quý khách là khách đặt phòng cần tra cứu đơn?
                    </p>
                    <p className="text-[11px] text-outline mt-0.5">
                      Đặt phòng tại VietSageBooking hoàn toàn không yêu cầu đăng ký tài khoản.
                    </p>
                  </div>
                  <Link
                    href="/booking/lookup"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface-container text-on-surface hover:text-primary text-xs font-bold transition-all border border-outline-variant/30 shrink-0"
                  >
                    <span>Tra cứu đơn</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

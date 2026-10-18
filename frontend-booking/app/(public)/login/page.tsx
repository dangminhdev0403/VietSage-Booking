'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  User,
  KeyRound,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { luxuryAlert } from '@/lib/alert/luxury-alert';
import { LuxuryAlertBanner } from '@/components/shared/luxury-alert-banner';
import { sanitizeInternalCallbackUrl } from '@/lib/auth/rbac';

function LoginContent() {
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams.get('callbackUrl');
  const callbackUrl = sanitizeInternalCallbackUrl(rawCallbackUrl, '/admin');
  const errorParam = searchParams.get('error');

  const { status } = useSession();
  const hasRedirectedRef = React.useRef(false);

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
    if (status === 'authenticated' && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
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
        hasRedirectedRef.current = true;
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
    <div className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-center py-10 lg:py-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-slate-900">
      {/* Cinematic Resort Atmosphere Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src="/images/login-showcase.jpg"
          alt="VietSage Management & Partner Portal Background"
          className="w-full h-full object-cover scale-105 filter blur-[3px]"
        />
        {/* Soft luminous scrim - significantly reduced darkness to let resort daylight and warm wood glow through */}
        <div className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto">
        {/* Top Back Link */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white hover:text-amber-200 transition-colors drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Quay lại Trang chủ</span>
          </Link>
        </div>

        {/* Dedicated Partner & Staff Login Form */}
        <div className="bg-surface-container-lowest/95 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)] p-8 sm:p-12">
          {/* Header */}
          <div className="flex flex-col gap-1.5 mb-8">
            <div className="inline-flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Compass className="w-4 h-4" />
              <span>Cổng Dành Cho Cán Bộ &amp; Đối Tác</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              Đăng Nhập Quản Trị &amp; Đối Tác Khách Sạn
            </h1>
            <p className="text-sm text-outline mt-0.5">
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
                    <p className="text-xs text-outline mt-0.5">
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

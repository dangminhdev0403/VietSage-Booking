'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import {
  Lock,
  User,
  KeyRound,
  Loader2,
  Eye,
  EyeOff,
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
    <div className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center p-3 sm:p-6 lg:p-8 overflow-hidden bg-slate-900">
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

      <div className="relative z-10 w-full max-w-lg mx-auto my-auto">
        {/* Dedicated Partner & Staff Login Form Card */}
        <div className="bg-surface-container-lowest/95 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)] p-6 sm:p-8 md:p-10">
          <div className="mb-6 sm:mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight text-balance">
              Đăng Nhập Hệ Thống
            </h1>
            <p className="text-sm sm:text-base text-outline mt-2 text-pretty">
              Nhập thông tin xác thực để truy cập bảng điều khiển.
            </p>
          </div>

          {/* Status Alerts */}
          {errorMessage && (
            <LuxuryAlertBanner
              variant="error"
              description={errorMessage}
              onClose={() => setErrorMessage(null)}
              className="mb-5"
            />
          )}

          {/* LOGIN FORM */}
          <form onSubmit={handleLoginSubmit} className="space-y-5 sm:space-y-6">
            <div>
              <label className="block text-sm sm:text-base font-bold text-on-surface mb-2">
                Tài khoản hoặc email công tác
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-outline absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin@vietsage.vn hoặc tên đăng nhập"
                  className="w-full pl-12 pr-4 py-3.5 sm:py-4 bg-surface-container-low rounded-2xl border border-outline-variant/30 focus:border-primary text-base sm:text-lg font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm sm:text-base font-bold text-on-surface">
                  Mật khẩu
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
                  className="text-sm sm:text-base text-primary font-bold hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-outline absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-12 pr-12 py-3.5 sm:py-4 bg-surface-container-low rounded-2xl border border-outline-variant/30 focus:border-primary text-base sm:text-lg font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors cursor-pointer"
                  aria-label={showLoginPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showLoginPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-4 rounded-full bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-extrabold text-base sm:text-lg tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang xác thực thông tin...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Đăng nhập hệ thống</span>
                </>
              )}
            </button>
          </form>
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

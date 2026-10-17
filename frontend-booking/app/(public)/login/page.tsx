'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  User,
  KeyRound,
  ShieldCheck,
  Loader2,
  Sparkles,
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  Wine,
  Crown,
  Headphones,
  Building2,
  Compass,
} from 'lucide-react';
import { luxuryAlert } from '@/lib/alert/luxury-alert';
import { LuxuryAlertBanner } from '@/components/shared/luxury-alert-banner';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const errorParam = searchParams.get('error');

  const { status } = useSession();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<'TRAVELER' | 'HOTEL_PARTNER'>('TRAVELER');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Status state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam === 'forbidden'
      ? 'Tài khoản của bạn không có quyền truy cập khu vực Quản trị.'
      : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already authenticated, redirect to destination immediately
  useEffect(() => {
    if (status === 'authenticated') {
      const postLoginUrl = `/api/auth/post-login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`;
      window.location.assign(postLoginUrl);
    }
  }, [status, callbackUrl]);

  // Handle Login
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
        setErrorMessage('Thông tin đăng nhập không chính xác.');
      } else {
        const postLoginUrl = `/api/auth/post-login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`;
        window.location.assign(postLoginUrl);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối cổng đăng nhập.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regDisplayName.trim() || !regUsername.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ các thông tin đăng ký bắt buộc.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('Mật khẩu phải có độ dài tối thiểu 6 ký tự.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Mật khẩu nhập lại không trùng khớp.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Vui lòng đồng ý với Quy chế & Chính sách bảo mật để tiếp tục.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: regDisplayName.trim(),
          username: regUsername.trim(),
          email: regEmail.trim(),
          password: regPassword.trim(),
          role: regRole,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data?.error?.message || 'Đăng ký tài khoản không thành công.');
        return;
      }

      setSuccessMessage('Đăng ký thành công! Đang tự động đăng nhập vào tài khoản của bạn...');

      // Auto sign-in
      const signInRes = await signIn('credentials', {
        username: regUsername.trim(),
        password: regPassword.trim(),
        redirect: false,
      });

      if (signInRes?.error) {
        setMode('login');
        setLoginUsername(regUsername.trim());
        setErrorMessage('Tài khoản đã tạo thành công. Vui lòng đăng nhập.');
      } else {
        const postLoginUrl = `/api/auth/post-login${regRole === 'HOTEL_PARTNER' ? '?callbackUrl=/admin' : ''}`;
        window.location.assign(postLoginUrl);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối đăng ký.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-[calc(100vh-5rem)] bg-background py-8 lg:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1280px] mx-auto">
        {/* Top Breadcrumb */}
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
            <span className="hidden sm:inline">Xác thực an toàn VietSage Security 2026</span>
            <span className="sm:hidden">Bảo mật SSL</span>
          </div>
        </div>

        {/* Master Asymmetric Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* LEFT COLUMN: Editorial Luxury Showcase (Desktop 5 cols) */}
          <div className="lg:col-span-5 hidden lg:flex flex-col justify-between rounded-3xl overflow-hidden relative shadow-xl min-h-[740px] p-8 lg:p-10 border border-outline-variant/30 isolate">
            {/* Background Image */}
            <img
              src="/images/login-showcase.jpg"
              alt="VietSage Luxury Resort & Suites"
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
            {/* Cinematic Gradient Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/35 z-10 pointer-events-none" />

            {/* Top Brand Tag */}
            <div className="relative z-20 flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface/90 backdrop-blur-md shadow-sm w-fit">
                <Crown className="w-4 h-4 text-primary" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-on-surface">
                  VietSage VIP Club
                </span>
              </div>
              <span className="text-xs uppercase tracking-widest text-primary-fixed font-bold">
                Cổng Dịch Vụ Khách Hàng Thượng Lưu
              </span>
            </div>

            {/* Bottom Content & Elite Privileges */}
            <div className="relative z-20 flex flex-col gap-5 text-white">
              <div>
                <p className="text-xs uppercase tracking-widest text-amber-200 font-bold mb-1.5">
                  Trải Nghiệm Độc Quyền
                </p>
                <h2 className="text-3xl font-extrabold text-white leading-tight">
                  Bản Giao Hưởng <br />
                  <span className="font-sans italic font-bold text-primary-fixed">
                    Nghỉ Dưỡng Thượng Lưu
                  </span>
                </h2>
                <p className="text-xs text-slate-200/85 mt-2 leading-relaxed">
                  Bước vào thế giới của các đặc quyền cá nhân hóa, đồng bộ thông tin đặt phòng tức thì và bảo mật tuyệt đối trên hệ sinh thái VietSage.
                </p>
              </div>

              {/* 3 Privileges */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-primary-container/30 flex items-center justify-center shrink-0 text-amber-200">
                    <Wine className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white tracking-wide">
                      Đặc Quyền Ẩm Thực Chào Mừng
                    </span>
                    <span className="text-[11px] text-slate-300 truncate">
                      Rượu vang hảo hạng & trà thảo mộc tại phòng
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-primary-container/30 flex items-center justify-center shrink-0 text-amber-200">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white tracking-wide">
                      Nâng Hạng Biệt Thự & Phòng Suite
                    </span>
                    <span className="text-[11px] text-slate-300 truncate">
                      Ưu tiên tầm nhìn biển và hồ bơi riêng biệt
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-primary-container/30 flex items-center justify-center shrink-0 text-amber-200">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white tracking-wide">
                      Chăm Sóc Khách Hàng 24/7
                    </span>
                    <span className="text-[11px] text-slate-300 truncate">
                      Tư vấn lịch trình nghỉ dưỡng và dịch vụ đưa đón chu đáo
                    </span>
                  </div>
                </div>
              </div>

              {/* Quote */}
              <div className="pt-2 flex items-center justify-between text-slate-300 text-xs border-t border-white/10">
                <span>Hơn 5,000+ Thượng khách đồng hành</span>
                <span className="text-amber-200 font-bold uppercase tracking-wider text-[11px]">
                  VietSage Society
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Auth Card (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-xl p-6 sm:p-10 lg:p-12">
              {/* Header */}
              <div className="flex flex-col gap-1 mb-6">
                <div className="inline-flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <Compass className="w-4 h-4" />
                  <span>Cổng Dịch Vụ Khách Hàng & Đối Tác</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
                  {mode === 'login' ? 'Đăng Nhập Tài Khoản' : 'Đăng Ký Hội Viên Mới'}
                </h1>
                <p className="text-xs sm:text-sm text-outline mt-0.5">
                  {mode === 'login'
                    ? 'Chào mừng quý khách trở lại với không gian nghỉ dưỡng tinh tế VietSageBooking.'
                    : 'Gia nhập mạng lưới hội viên thượng lưu để nhận chuỗi đặc quyền và giá ưu đãi độc quyền.'}
                </p>
              </div>

              {/* Interactive Tabs */}
              <div className="flex items-center p-1.5 bg-surface-container-low rounded-2xl mb-6 shadow-inner border border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                    mode === 'login'
                      ? 'bg-surface-container-lowest text-on-surface shadow-sm font-extrabold border border-outline-variant/30'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  <Lock className="w-4 h-4 text-primary" />
                  <span>Đăng Nhập</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                    mode === 'register'
                      ? 'bg-surface-container-lowest text-on-surface shadow-sm font-extrabold border border-outline-variant/30'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Đăng Ký Hội Viên</span>
                </button>
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

              {successMessage && (
                <LuxuryAlertBanner
                  variant="success"
                  title="Thao Tác Thành Công"
                  description={successMessage}
                  onClose={() => setSuccessMessage(null)}
                  className="mb-5"
                />
              )}

              {/* FORM 1: LOGIN */}
              {mode === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
                      Tên Đăng Nhập Hoặc Email
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-outline absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        placeholder="Nhập tên đăng nhập hoặc email..."
                        className="w-full pl-11 pr-4 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/20 focus:border-primary text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-outline">
                        Mật Khẩu
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          luxuryAlert.info({
                            title: 'Hỗ Trợ Khôi Phục Mật Khẩu',
                            message: 'Quý khách vui lòng liên hệ tổng đài hỗ trợ 1900 8888 hoặc hòm thư hỗ trợ để được hướng dẫn cấp lại mật khẩu.',
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
                        className="w-full pl-11 pr-12 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/20 focus:border-primary text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
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

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-on-surface select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                      />
                      <span>Ghi nhớ đăng nhập trên thiết bị tin cậy này</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3.5 rounded-full bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-extrabold text-sm tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang xác thực bảo mật...</span>
                      </>
                    ) : (
                      <span>Đăng Nhập Tài Khoản</span>
                    )}
                  </button>
                </form>
              ) : (
                /* FORM 2: REGISTER */
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {/* Role Switcher */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
                      Bạn Đăng Ký Với Vai Trò
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRegRole('TRAVELER')}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                          regRole === 'TRAVELER'
                            ? 'border-primary bg-primary-container/20 text-on-primary-container font-bold shadow-sm'
                            : 'border-outline-variant/30 bg-surface-container-low text-outline hover:text-on-surface'
                        }`}
                      >
                        <User className="w-4 h-4 text-primary" />
                        <div>
                          <div className="text-xs font-extrabold">Du Khách Thượng Lưu</div>
                          <div className="text-[10px] opacity-80">Đặt phòng & nhận ưu đãi</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegRole('HOTEL_PARTNER')}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                          regRole === 'HOTEL_PARTNER'
                            ? 'border-primary bg-primary-container/20 text-on-primary-container font-bold shadow-sm'
                            : 'border-outline-variant/30 bg-surface-container-low text-outline hover:text-on-surface'
                        }`}
                      >
                        <Building2 className="w-4 h-4 text-primary" />
                        <div>
                          <div className="text-xs font-extrabold">Đối Tác Khách Sạn</div>
                          <div className="text-[10px] opacity-80">Quản lý quỹ phòng & giá</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
                      Họ Và Tên Thượng Khách
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-outline absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={regDisplayName}
                        onChange={(e) => setRegDisplayName(e.target.value)}
                        placeholder="Nguyễn Hoàng Nam"
                        className="w-full pl-11 pr-4 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/20 focus:border-primary text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Dual Grid: Username & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
                        Tên Đăng Nhập
                      </label>
                      <input
                        type="text"
                        required
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="nam.nguyen"
                        className="w-full px-4 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/20 focus:border-primary text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
                        Địa Chỉ Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-outline absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="nam@vietsage.vn"
                          className="w-full pl-11 pr-4 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/20 focus:border-primary text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dual Grid: Password & Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
                        Mật Khẩu (Min 6 ký tự)
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-outline absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-11 pr-11 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/20 focus:border-primary text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword((prev) => !prev)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors cursor-pointer"
                        >
                          {showRegPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
                        Nhập Lại Mật Khẩu
                      </label>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/20 focus:border-primary text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="agree-terms"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-primary accent-primary cursor-pointer shrink-0"
                    />
                    <label
                      htmlFor="agree-terms"
                      className="text-xs text-outline leading-relaxed cursor-pointer select-none"
                    >
                      Tôi đồng ý với{' '}
                      <span className="text-primary font-bold hover:underline">
                        Quy chế hội viên VietSageBooking
                      </span>{' '}
                      và cam kết tuân thủ chính sách bảo mật dữ liệu khách hàng.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3.5 rounded-full bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-extrabold text-sm tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang xử lý đăng ký hội viên...</span>
                      </>
                    ) : (
                      <span>Tạo Tài Khoản VietSage</span>
                    )}
                  </button>

                  <div className="pt-2 text-center">
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Trải nghiệm Đăng ký Hội Viên May Đo Sở Thích (Aurum Elite) →</span>
                    </Link>
                  </div>
                </form>
              )}

              {/* Card Trust & Hotline Footer */}
              <div className="mt-8 pt-6 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-4 text-xs text-outline">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Mã hóa 256-bit SSL bảo vệ dữ liệu</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold">
                  <Headphones className="w-4 h-4 text-primary" />
                  <span>Tổng đài 24/7:</span>
                  <a href="tel:19008888" className="text-primary hover:underline font-bold">
                    1900 8888
                  </a>
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

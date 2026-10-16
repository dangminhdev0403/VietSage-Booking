'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { signIn } from 'next-auth/react';
import {
  X,
  Lock,
  User,
  ShieldCheck,
  Loader2,
  Sparkles,
  KeyRound,
  AlertCircle,
  Mail,
  CheckCircle2,
  Building2,
  Eye,
  EyeOff,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const emptySubscribe = () => () => {};

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'TRAVELER' | 'HOTEL_PARTNER'>('TRAVELER');

  // Status state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !isMounted) return null;

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
        setErrorMessage('Tên đăng nhập hoặc mật khẩu không chính xác.');
      } else {
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối đến cổng đăng nhập.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regDisplayName.trim() || !regUsername.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ các trường thông tin đăng ký.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('Mật khẩu tối thiểu 6 ký tự.');
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

      setSuccessMessage('Đăng ký thành công! Đang đăng nhập...');

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
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ đăng ký.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };


  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="relative w-full max-w-lg bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xl p-6 sm:p-8 my-auto max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-primary-container/20 text-primary flex items-center justify-center mb-2.5">
            <Lock className="w-6 h-6" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container/20 text-primary text-xs font-bold uppercase tracking-wider mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Cổng Dịch Vụ VietSageBooking</span>
          </div>
          <h2 className="text-2xl font-extrabold text-on-surface">
            {mode === 'login' ? 'Chào Mừng Trở Lại' : 'Gia Nhập VietSage Club'}
          </h2>
          <p className="text-xs text-outline mt-1">
            {mode === 'login'
              ? 'Đăng nhập tài khoản để quản lý đơn phòng và tiếp cận ưu đãi.'
              : 'Tạo tài khoản hội viên thượng lưu nhận ngay đặc quyền nghỉ dưỡng.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-surface-container-low rounded-xl mb-5 shadow-inner border border-outline-variant/20">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-surface-container-lowest text-on-surface shadow-sm font-extrabold border border-outline-variant/20'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span>Đăng Nhập</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'register'
                ? 'bg-surface-container-lowest text-on-surface shadow-sm font-extrabold border border-outline-variant/20'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Đăng Ký Hội Viên</span>
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1">
                Tên Đăng Nhập / Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập..."
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container rounded-xl border border-transparent focus:border-primary text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1">
                Mật Khẩu
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full pl-10 pr-10 py-2.5 bg-surface-container rounded-xl border border-transparent focus:border-primary text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-full bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-extrabold text-sm tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <span>Đăng Nhập</span>
              )}
            </button>
          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            {/* Role picker */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1">
                Vai Trò
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegRole('TRAVELER')}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    regRole === 'TRAVELER'
                      ? 'border-primary bg-primary-container/20 text-on-primary-container'
                      : 'border-outline-variant/30 text-outline hover:text-on-surface'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span>Du Khách</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRegRole('HOTEL_PARTNER')}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    regRole === 'HOTEL_PARTNER'
                      ? 'border-primary bg-primary-container/20 text-on-primary-container'
                      : 'border-outline-variant/30 text-outline hover:text-on-surface'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  <span>Đối Tác KS</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1">
                Họ Và Tên
              </label>
              <input
                type="text"
                required
                value={regDisplayName}
                onChange={(e) => setRegDisplayName(e.target.value)}
                placeholder="Nguyễn Hoàng Nam"
                className="w-full px-3.5 py-2.5 bg-surface-container rounded-xl border border-transparent focus:border-primary text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1">
                  Tên Đăng Nhập
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="nam.nguyen"
                  className="w-full px-3 py-2.5 bg-surface-container rounded-xl border border-transparent focus:border-primary text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="nam@vietsage.vn"
                    className="w-full pl-9 pr-2 py-2.5 bg-surface-container rounded-xl border border-transparent focus:border-primary text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1">
                Mật Khẩu (Tối thiểu 6 ký tự)
              </label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-surface-container rounded-xl border border-transparent focus:border-primary text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-full bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-extrabold text-sm tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý đăng ký...</span>
                </>
              ) : (
                <span>Tạo Tài Khoản Hội Viên</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}

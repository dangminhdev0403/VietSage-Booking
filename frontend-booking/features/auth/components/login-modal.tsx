'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import {
  X,
  Lock,
  User,
  ShieldCheck,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { LuxuryAlertBanner } from '@/components/shared/luxury-alert-banner';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const emptySubscribe = () => () => {};

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Status state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        setErrorMessage('Thông tin đăng nhập không chính xác hoặc tài khoản không có quyền truy cập.');
      } else {
        onClose();
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.assign('/api/auth/post-login?callbackUrl=/admin');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối đến cổng đăng nhập.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="relative w-full max-w-md bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xl p-6 sm:p-8 my-auto max-h-[92vh] overflow-y-auto"
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
        <div className="mb-6 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-primary-container/20 text-primary flex items-center justify-center mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container/20 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Cổng Quản Trị &amp; Đối Tác</span>
          </div>
          <h2 className="text-2xl font-extrabold text-on-surface">
            Đăng Nhập Quản Trị &amp; Đối Tác
          </h2>
          <p className="text-xs text-outline mt-1 leading-relaxed">
            Dành cho Quản trị viên hệ thống VietSage và các Đối tác vận hành khách sạn.
          </p>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <LuxuryAlertBanner
            variant="error"
            description={errorMessage}
            onClose={() => setErrorMessage(null)}
            className="mb-4"
          />
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1">
              Tên Đăng Nhập Hoặc Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập hoặc email..."
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container rounded-xl border border-transparent focus:border-primary text-base font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
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
                placeholder="Nhập mật khẩu bảo mật..."
                className="w-full pl-10 pr-10 py-2.5 bg-surface-container rounded-xl border border-transparent focus:border-primary text-base font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
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
            className="w-full mt-2 py-3 rounded-full bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-extrabold text-base tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xác thực thông tin...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Đăng Nhập Quản Trị</span>
              </>
            )}
          </button>
        </form>

        {/* Guest Self-Service Redirect Box */}
        <div className="mt-6 pt-4 border-t border-outline-variant/20 text-center">
          <p className="text-xs text-outline mb-2">
            Quý khách là du khách muốn tra cứu đơn phòng?
          </p>
          <Link
            href="/booking/lookup"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
          >
            <span>Tra cứu đơn đặt phòng không cần tài khoản</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}

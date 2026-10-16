'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await signIn('credentials', {
        username: username.trim(),
        password: password.trim(),
        redirect: false,
      });

      if (res?.error) {
        setErrorMessage('Tên đăng nhập hoặc mật khẩu không chính xác.');
      } else {
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi kết nối đến cổng đăng nhập.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setUsername('superadmin');
    setPassword('Admin@123456');
    setErrorMessage(null);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="relative w-full max-w-md bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xl p-7 sm:p-8 my-auto max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-primary-container/20 text-primary flex items-center justify-center mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container/20 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Cổng Đăng Nhập VietSageBooking</span>
          </div>
          <h2 className="text-2xl font-extrabold text-on-surface">Chào Mừng Trở Lại</h2>
          <p className="text-xs sm:text-sm text-outline mt-1">
            Đăng nhập tài khoản để điều hành hệ thống hoặc quản lý đơn đặt phòng.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
              Tên Đăng Nhập / Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-outline absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập..."
                className="w-full pl-11 pr-4 py-3 bg-surface-container rounded-2xl border border-transparent focus:border-primary text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
              Mật Khẩu
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-outline absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full pl-11 pr-4 py-3 bg-surface-container rounded-2xl border border-transparent focus:border-primary text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 rounded-full bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-bold text-sm tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xác thực...</span>
              </>
            ) : (
              <span>Đăng Nhập Ngay</span>
            )}
          </button>
        </form>

        {/* Quick Demo Fill Button */}
        <div className="mt-5 pt-4 border-t border-outline-variant/20 flex flex-col items-center">
          <button
            type="button"
            onClick={handleFillDemo}
            className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline cursor-pointer py-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Điền nhanh tài khoản Quản trị mẫu (superadmin)</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

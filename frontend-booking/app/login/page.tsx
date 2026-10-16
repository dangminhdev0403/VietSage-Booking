'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  User,
  KeyRound,
  ShieldCheck,
  Loader2,
  Sparkles,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi kết nối cổng đăng nhập.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setUsername('superadmin');
    setPassword('Admin@123456');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xl p-8 sm:p-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-outline hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Trang chủ</span>
        </Link>

        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-container/20 text-primary flex items-center justify-center mb-3">
            <Lock className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container/20 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Xác Thực Tài Khoản</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">Đăng Nhập Hệ Thống</h1>
          <p className="text-xs sm:text-sm text-outline mt-1.5">
            Cổng truy cập dành cho đối tác lưu trú và người dùng VietSageBooking.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

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
                <span>Đang đăng nhập...</span>
              </>
            ) : (
              <span>Đăng Nhập</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-outline-variant/20 flex flex-col items-center">
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
    </div>
  );
}

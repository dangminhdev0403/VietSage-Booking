'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  FileText,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';
import { useRegisterPartnerMutation } from '@/features/users/hooks/use-users';
import { LuxuryAlertBanner } from '@/components/shared/luxury-alert-banner';

const POPULAR_CITIES = ['Phú Quốc', 'Đà Nẵng', 'Đà Lạt', 'Hà Nội', 'Sapa', 'Hồ Chí Minh', 'Nha Trang'];

export default function RegisterPartnerPage() {
  const registerMutation = useRegisterPartnerMutation();

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');

  const [propertyName, setPropertyName] = useState('');
  const [city, setCity] = useState('Phú Quốc');
  const [customCity, setCustomCity] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  // Status states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const selectedCity = city === 'other' ? customCity.trim() : city;
    if (!selectedCity) {
      setErrorMessage('Vui lòng nhập thành phố / điểm đến của cơ sở lưu trú.');
      return;
    }

    try {
      await registerMutation.mutateAsync({
        display_name: displayName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        property_name: propertyName.trim(),
        city: selectedCity,
        address: address.trim(),
        description: description.trim() || undefined,
      });

      setIsSuccess(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Đăng ký đối tác không thành công. Vui lòng kiểm tra lại thông tin.';
      setErrorMessage(msg);
    }
  };

  if (isSuccess) {
    return (
      <div className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-900">
        <div className="relative z-10 w-full max-w-lg bg-surface-container-lowest/95 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-6 sm:p-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider whitespace-nowrap">
              Hồ Sơ Đã Được Ghi Nhận
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface text-balance">
              Đăng Ký Đối Tác Thành Công
            </h1>
            <p className="text-xs sm:text-sm text-outline leading-relaxed text-pretty">
              Hồ sơ đăng ký khách sạn <strong className="text-on-surface">{propertyName}</strong> đã được gửi tới Ban quản trị. Quản trị viên sẽ xác minh và kích hoạt vai trò đối tác trong thời gian sớm nhất.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-left text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-700">
              <span className="text-outline">Tài khoản đăng nhập:</span>
              <span className="font-semibold">{username}</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="text-outline">Email công tác:</span>
              <span className="font-semibold">{email}</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="text-outline">Cơ sở lưu trú:</span>
              <span className="font-semibold">{propertyName}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full py-3.5 rounded-full bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-extrabold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Đi đến trang đăng nhập</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/"
              className="text-xs font-semibold text-outline hover:text-on-surface transition-colors"
            >
              Quay lại trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center p-3 sm:p-6 lg:p-8 overflow-hidden bg-slate-900">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src="/images/login-showcase.jpg"
          alt="Partner Registration Background"
          className="w-full h-full object-cover scale-105 filter blur-[3px]"
        />
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
      </div>

      <div className="relative z-10 w-full max-w-xl md:max-w-4xl lg:max-w-5xl mx-auto my-auto py-4 sm:py-6">
        <div className="bg-surface-container-lowest/95 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-6 sm:p-8 lg:p-10">
          <div className="mb-6 text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider whitespace-nowrap mb-2">
              Cổng Hợp Tác Đối Tác
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight text-balance">
              Đăng Ký Tham Gia Nền Tảng
            </h1>
            <p className="text-xs sm:text-sm text-outline mt-1.5 text-pretty">
              Dành riêng cho chủ sở hữu và đơn vị quản lý khách sạn, khu nghỉ dưỡng.
            </p>
          </div>

          {errorMessage && (
            <LuxuryAlertBanner
              variant="error"
              description={errorMessage}
              onClose={() => setErrorMessage(null)}
              className="mb-5"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {/* Cột 1: Thông tin người đại diện */}
              <div className="space-y-4">
                <div className="border-b border-outline-variant/30 pb-2.5">
                  <span className="text-xs font-extrabold text-primary uppercase tracking-wider whitespace-nowrap">
                    1. Thông tin người đại diện
                  </span>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5">
                    Họ và tên người đại diện
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/30 focus:border-primary text-xs sm:text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5">
                      Tên đăng nhập
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="partner_owner"
                      className="w-full px-3.5 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/30 focus:border-primary text-xs sm:text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5">
                      Số điện thoại liên hệ
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0912 345 678"
                        className="w-full pl-10 pr-3.5 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/30 focus:border-primary text-xs sm:text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5">
                    Email công tác
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contact@hotelresort.vn"
                      className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/30 focus:border-primary text-xs sm:text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5">
                    Mật khẩu đăng nhập
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full pl-10 pr-10 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/30 focus:border-primary text-xs sm:text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Cột 2: Thông tin khách sạn & cơ sở lưu trú */}
              <div className="space-y-4">
                <div className="border-b border-outline-variant/30 pb-2.5">
                  <span className="text-xs font-extrabold text-primary uppercase tracking-wider whitespace-nowrap">
                    2. Thông tin khách sạn & cơ sở lưu trú
                  </span>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5">
                    Tên khách sạn / Khu nghỉ dưỡng
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={propertyName}
                      onChange={(e) => setPropertyName(e.target.value)}
                      placeholder="Aurum Grand Boutique Hotel"
                      className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/30 focus:border-primary text-xs sm:text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className={city === 'other' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : ''}>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5">
                      Điểm đến / Thành phố
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/30 focus:border-primary text-xs sm:text-sm font-medium text-on-surface focus:outline-none transition-all cursor-pointer"
                    >
                      {POPULAR_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="other">Tỉnh / Thành phố khác</option>
                    </select>
                  </div>

                  {city === 'other' && (
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5">
                        Nhập tên tỉnh / thành phố
                      </label>
                      <input
                        type="text"
                        required
                        value={customCity}
                        onChange={(e) => setCustomCity(e.target.value)}
                        placeholder="Ví dụ: Quy Nhơn, Huế..."
                        className="w-full px-3.5 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/30 focus:border-primary text-xs sm:text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5">
                    Địa chỉ chi tiết
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Số nhà, tên đường, phường/xã"
                      className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/30 focus:border-primary text-xs sm:text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5">
                    Giới thiệu ngắn gọn hoặc quy mô phòng
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-outline absolute left-3.5 top-3.5" />
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Khách sạn 4 sao với 45 phòng ngủ, hồ bơi và nhà hàng..."
                      className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/30 focus:border-primary text-xs sm:text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-outline order-2 sm:order-1 text-center sm:text-left">
                <span>Đã có tài khoản đối tác? </span>
                <Link
                  href="/login"
                  className="font-bold text-primary hover:underline cursor-pointer"
                >
                  Đăng nhập ngay
                </Link>
              </div>

              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-extrabold text-sm sm:text-base tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 order-1 sm:order-2"
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang gửi hồ sơ đăng ký...</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4" />
                    <span>Gửi hồ sơ tham gia đối tác</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

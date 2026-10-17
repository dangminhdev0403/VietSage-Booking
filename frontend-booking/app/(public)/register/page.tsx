'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  Sparkles,
  ShieldCheck,
  Check,
  ArrowRight,
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  KeyRound,
  Calendar,
  Gift,
  Compass,
  ArrowLeft,
  Loader2,
  Waves,
  SunMedium,
  Trees,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { LuxuryAlertBanner } from '@/components/shared/luxury-alert-banner';

export default function RegisterElitePage() {
  const router = useRouter();

  // Step 1: Identity Information
  const [salutation, setSalutation] = useState<'mr' | 'ms' | 'dr' | 'prof'>('mr');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthday, setBirthday] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Bespoke Guest Preferences
  const [viewPreference, setViewPreference] = useState<'ocean_front' | 'sunset_hill' | 'zen_garden'>('ocean_front');
  const [pillowType, setPillowType] = useState('Lông Ngỗng 100% Siêu Mịn');
  const [scentType, setScentType] = useState('Cam Bergamot & Gỗ Tuyết Tùng');
  const [temperature, setTemperature] = useState('21.5°C (Lý tưởng)');
  const [cuisines, setCuisines] = useState<string[]>(['fresh_seafood']);
  const [addons, setAddons] = useState<string[]>(['butler_247', 'spa_relax']);

  // Agreement and Status
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const toggleCuisine = (val: string) => {
    setCuisines((prev) =>
      prev.includes(val) ? prev.filter((c) => c !== val) : [...prev, val]
    );
  };

  const toggleAddon = (val: string) => {
    setAddons((prev) =>
      prev.includes(val) ? prev.filter((a) => a !== val) : [...prev, val]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ các thông tin bắt buộc: Họ tên, Email và Mật khẩu.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu bảo mật phải có độ dài tối thiểu 6 ký tự.');
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      setErrorMessage('Mật khẩu nhập lại không trùng khớp.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Quý khách vui lòng đồng ý với Quy chế Thành viên VietSage VIP Club để tiếp tục.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Derive username from email if not provided
    const finalUsername = username.trim() || email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: fullName.trim(),
          username: finalUsername,
          email: email.trim(),
          password: password.trim(),
          role: 'TRAVELER',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data?.error?.message || 'Đăng ký tài khoản không thành công.');
        return;
      }

      setSuccessMessage('Gia nhập VietSage VIP Club thành công! Đang tự động đăng nhập và kích hoạt đặc quyền...');

      // Auto sign in with NextAuth credentials
      const signInRes = await signIn('credentials', {
        username: finalUsername,
        password: password.trim(),
        redirect: false,
      });

      if (signInRes?.error) {
        router.push('/login?registered=true');
      } else {
        setTimeout(() => {
          window.location.assign('/my-bookings');
        }, 1200);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối cổng đăng ký.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1320px] mx-auto">
        {/* Top Breadcrumb & Return Link */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-outline hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Trang chủ</span>
          </Link>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-high/80 border border-outline-variant/30 text-xs font-semibold text-on-surface">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Xác thực an toàn VietSage Security 2026</span>
          </div>
        </div>

        {/* Top Luxury Banner & Privileges Intro */}
        <section className="relative w-full rounded-3xl overflow-hidden bg-surface-container-lowest border border-outline-variant/30 shadow-md mb-10">
          <div className="relative grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[380px]">
            {/* Left Content Column */}
            <div className="lg:col-span-7 flex flex-col justify-between p-8 sm:p-12 relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary-container/20 shadow-xs mb-4">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-extrabold uppercase tracking-widest text-primary">
                    Chương Trình Đặc Quyền VietSage VIP Club
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-black text-on-surface mb-3 tracking-tight leading-tight">
                  Gia Nhập Hội Viên <span className="italic font-normal text-primary">VietSage VIP Club</span>
                </h1>
                <p className="text-base text-outline max-w-xl mb-6 leading-relaxed">
                  Mở cánh cửa đến với trải nghiệm nghỉ dưỡng bespoke tĩnh tại. Thiết lập hồ sơ lưu trú một lần duy nhất để tận hưởng sự chăm sóc cá nhân hóa chuẩn xác tại mọi điểm đến trong hệ thống resort.
                </p>
              </div>

              {/* Exclusive Welcome Gifts Pill */}
              <div className="p-4 sm:p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    <Gift className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-primary">
                      Đặc Ân Chào Mừng Thành Viên Mới
                    </p>
                    <p className="text-base font-bold text-on-surface">
                      Tặng ngay E-Voucher 2.000.000₫ &amp; Nhận phòng sớm lúc 10:30
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-outline font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Hiệu lực trọn đời</span>
                </div>
              </div>
            </div>

            {/* Right Visual Feature */}
            <div className="lg:col-span-5 relative min-h-[280px] lg:min-h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80"
                alt="VietSage Luxury Resort"
                className="w-full h-full object-cover absolute inset-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-surface-container-lowest via-surface-container-lowest/20 to-transparent" />
              <div className="absolute bottom-6 right-6 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md shadow-md flex items-center gap-2 text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium tracking-wide">Vịnh San Hô, Phú Quốc • 18:24</span>
              </div>
            </div>
          </div>
        </section>

        {/* Status Alerts */}
        {errorMessage && (
          <LuxuryAlertBanner
            variant="error"
            description={errorMessage}
            onClose={() => setErrorMessage(null)}
            className="mb-6"
          />
        )}

        {successMessage && (
          <LuxuryAlertBanner
            variant="success"
            title="Thao Tác Thành Công"
            description={successMessage}
            onClose={() => setSuccessMessage(null)}
            className="mb-6"
          />
        )}

        {/* Interactive Registration & Bespoke Preferences Form */}
        <form onSubmit={handleSubmit} className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Profile & Identity (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                  <div>
                    <h2 className="text-xl font-sans font-bold text-on-surface">Thông Tin Định Danh</h2>
                    <p className="text-xs text-outline mt-0.5">Sử dụng để xác nhận hồ sơ đặt phòng bảo mật</p>
                  </div>
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-surface-container text-outline">
                    01 / 02
                  </span>
                </div>

                {/* Salutation Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-2">
                    Danh Xưng Ưu Tiên
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'mr' as const, label: 'Ông' },
                      { id: 'ms' as const, label: 'Bà' },
                      { id: 'dr' as const, label: 'Tiến Sĩ' },
                      { id: 'prof' as const, label: 'GS' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSalutation(item.id)}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          salutation === item.id
                            ? 'bg-primary text-on-primary shadow-xs'
                            : 'bg-surface-container text-outline hover:text-on-surface hover:bg-surface-container-high'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
                    Họ Và Tên Đầy Đủ (Như trên Hộ Chiếu/CCCD) *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-outline absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Hoàng Minh"
                      className="w-full pl-11 pr-4 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/30 focus:border-primary text-base font-medium text-on-surface focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
                      Thư Điện Tử (Email) *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-outline absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="guest@example.com"
                        className="w-full pl-11 pr-4 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/30 focus:border-primary text-base font-medium text-on-surface focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
                      Số Điện Thoại Di Động
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-outline absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+84 908 123 456"
                        className="w-full pl-11 pr-4 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/30 focus:border-primary text-base font-medium text-on-surface focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
                      Mật Khẩu Bảo Mật *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-outline absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Tối thiểu 6 ký tự"
                        className="w-full pl-11 pr-11 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/30 focus:border-primary text-base font-medium text-on-surface focus:outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
                      Nhập Lại Mật Khẩu
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/30 focus:border-primary text-base font-medium text-on-surface focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Birthday for VIP Gift */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
                    Ngày Sinh (Quà Tặng Sinh Nhật VIP)
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-outline absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/30 focus:border-primary text-base font-medium text-on-surface focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Trust & Security Commitment Card */}
              <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-on-surface mb-1">
                    Cam Kết Bảo Mật Chuẩn Thụy Sĩ
                  </h4>
                  <p className="text-xs text-outline leading-relaxed">
                    Dữ liệu cá nhân và sở thích lưu trú được mã hóa 256-bit độc quyền, chỉ chia sẻ duy nhất với đội ngũ Concierge tại biệt thự khi quý khách hoàn tất nhận phòng.
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Bespoke Guest Preferences (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-sans font-bold text-on-surface">Thiết Lập Sở Thích Nghỉ Dưỡng</h2>
                    </div>
                    <p className="text-xs text-outline mt-0.5">Tùy chỉnh tiêu chuẩn đón tiếp độc bản (Bespoke Guest Preferences)</p>
                  </div>
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-surface-container text-outline">
                    02 / 02
                  </span>
                </div>

                {/* Section 1: Room Orientation / Views */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-on-surface">
                      1. Hướng Cảnh Quan Mong Muốn
                    </label>
                    <span className="text-[11px] text-outline font-medium">Chọn 1 tùy chọn chính</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: 'ocean_front' as const,
                        title: 'Ocean Front',
                        desc: 'Đối diện trực diện bờ vịnh ngắm bình minh',
                        icon: Waves,
                      },
                      {
                        id: 'sunset_hill' as const,
                        title: 'Đồi Hoàng Hôn',
                        desc: 'Cao độ tuyệt đối ngắm trọn vẹn ráng chiều',
                        icon: SunMedium,
                      },
                      {
                        id: 'zen_garden' as const,
                        title: 'Zen Garden',
                        desc: 'Khuôn viên vườn bonsai tĩnh tại, kín đáo',
                        icon: Trees,
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = viewPreference === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setViewPreference(item.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-primary bg-primary-container/15 shadow-sm'
                              : 'border-outline-variant/30 bg-surface-container-low hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-outline'}`} />
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-primary bg-primary' : 'border-outline-variant'
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-extrabold text-on-surface">{item.title}</div>
                            <div className="text-[11px] text-outline mt-1 leading-snug">{item.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Suite Ambiance & Bedding */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-on-surface mb-3">
                    2. Chuẩn Mực Phòng Ngủ Đón Tiếp
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1.5">
                      <span className="text-[11px] font-bold text-outline uppercase tracking-wider block">
                        Gối Ngủ Hoàng Gia
                      </span>
                      <select
                        value={pillowType}
                        onChange={(e) => setPillowType(e.target.value)}
                        className="w-full p-2 bg-surface-container-lowest rounded-xl text-xs font-semibold text-on-surface border border-outline-variant/30 outline-hidden"
                      >
                        <option>Lông Ngỗng 100% Siêu Mịn</option>
                        <option>Memory Foam Trị Liệu Cổ</option>
                        <option>Cao Su Thiên Nhiên Hữu Cơ</option>
                        <option>Vỏ Đậu Hạt Thảo Dược</option>
                      </select>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1.5">
                      <span className="text-[11px] font-bold text-outline uppercase tracking-wider block">
                        Nhiệt Độ Khởi Điểm
                      </span>
                      <div className="p-2 bg-surface-container-lowest rounded-xl flex items-center justify-between border border-outline-variant/30">
                        <span className="text-xs text-on-surface font-semibold">{temperature}</span>
                        <span className="text-[10px] font-bold text-primary uppercase bg-primary-container/20 px-2 py-0.5 rounded">
                          Mát Dịu
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1.5">
                      <span className="text-[11px] font-bold text-outline uppercase tracking-wider block">
                        Mùi Hương Trầm Tĩnh
                      </span>
                      <select
                        value={scentType}
                        onChange={(e) => setScentType(e.target.value)}
                        className="w-full p-2 bg-surface-container-lowest rounded-xl text-xs font-semibold text-on-surface border border-outline-variant/30 outline-hidden"
                      >
                        <option>Cam Bergamot & Gỗ Tuyết Tùng</option>
                        <option>Trầm Hương & Trà Trắng</option>
                        <option>Oải Hương Provence Tinh Khiết</option>
                        <option>Không Sử Dụng Tinh Dầu</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 3: Dining & Culinary Profile */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-on-surface">
                      3. Sở Thích Ẩm Thực &amp; Dinh Dưỡng
                    </label>
                    <span className="text-[11px] text-outline font-medium">Chọn nhiều mục</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'zero_alcohol', label: 'Mocktail & Zero Alcohol' },
                      { id: 'fresh_seafood', label: 'Hải Sản Tươi Sống' },
                      { id: 'plant_based', label: 'Thuần Chay Hữu Cơ' },
                      { id: 'kids_menu', label: 'Thực Đơn Trẻ Nhỏ' },
                    ].map((item) => {
                      const isChecked = cuisines.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleCuisine(item.id)}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer text-xs font-bold ${
                            isChecked
                              ? 'border-primary bg-primary text-on-primary shadow-xs'
                              : 'border-outline-variant/30 bg-surface-container-low text-on-surface hover:border-primary/50'
                          }`}
                        >
                          {item.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 4: Signature Bespoke Services */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-on-surface mb-3">
                    4. Dịch Vụ Gia Tăng Ưu Tiên Thiết Lập Sẵn
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: 'butler_247',
                        title: 'Quản Gia Riêng 24/7',
                        desc: 'Phục vụ hành lý, ủi phẳng y phục và trà chiều',
                      },
                      {
                        id: 'maybach_transfer',
                        title: 'Đón Tiễn Maybach',
                        desc: 'Xe riêng sang trọng đưa đón từ sân bay quốc tế',
                      },
                      {
                        id: 'spa_relax',
                        title: 'Đặt Trước Spa Thư Giãn',
                        desc: 'Liệu trình thải độc khoáng nóng ngày nhận phòng',
                      },
                    ].map((item) => {
                      const isChecked = addons.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleAddon(item.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isChecked
                              ? 'border-primary bg-primary-container/15 shadow-xs'
                              : 'border-outline-variant/30 bg-surface-container-low hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-extrabold text-on-surface">{item.title}</span>
                            <div
                              className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                                isChecked ? 'bg-primary border-primary text-white' : 'border-outline-variant'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                          <span className="text-[11px] text-outline leading-snug">{item.desc}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Submission & Terms */}
                <div className="pt-4 border-t border-outline-variant/20 space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer text-xs text-outline leading-relaxed select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-primary accent-primary cursor-pointer shrink-0"
                    />
                    <span>
                      Tôi đồng ý với{' '}
                      <span className="text-primary font-bold hover:underline">
                        Quy chế Thành viên VietSage VIP Club
                      </span>{' '}
                      và xác nhận đọc hiểu chính sách bảo mật dữ liệu khách sạn quốc tế. Mọi đặc quyền có thể hủy hoặc điều chỉnh bất kỳ lúc nào.
                    </span>
                  </label>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <div className="text-xs text-outline">
                      Đã có thẻ hội viên?{' '}
                      <Link href="/login" className="text-primary font-bold hover:underline">
                        Đăng nhập ngay →
                      </Link>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-extrabold text-base tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang khởi tạo hồ sơ Elite...</span>
                        </>
                      ) : (
                        <>
                          <span>Hoàn Tất Đăng Ký &amp; Nhận Đặc Quyền Elite</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

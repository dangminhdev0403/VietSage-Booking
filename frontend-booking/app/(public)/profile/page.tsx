'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Crown,
  Key,
  User,
  Sparkles,
  CreditCard,
  PhoneCall,
} from 'lucide-react';
import { UserMenu } from '@/features/auth/components/user-menu';

type SessionType = {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
};

function ProfileContent({ session }: { session: SessionType }) {
  const [displayName, setDisplayName] = useState(session.user?.name || '');
  const [email, setEmail] = useState(session.user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName, email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Cập nhật hồ sơ thất bại');
      }
      setProfileMsg({ type: 'success', text: 'Cập nhật thông tin hồ sơ thành công!' });
    } catch (err: unknown) {
      setProfileMsg({ type: 'error', text: err instanceof Error ? err.message : 'Có lỗi xảy ra' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Mật khẩu mới xác nhận không khớp' });
      return;
    }

    setPasswordLoading(true);
    setPasswordMsg(null);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Đổi mật khẩu thất bại');
      }
      setPasswordMsg({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPasswordMsg({ type: 'error', text: err instanceof Error ? err.message : 'Có lỗi xảy ra' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-12 flex-1 space-y-12">
      {/* Title & Introduction */}
        <div className="border-b border-outline-variant/30 pb-6">
          <span className="text-xs uppercase tracking-widest text-primary font-bold">
            VietSage Privilege
          </span>
          <h1 className="text-3xl sm:text-4xl font-sans font-extrabold text-on-surface mt-1 tracking-tight">
            Hồ Sơ Cá Nhân &amp; Thẻ Hội Viên Thượng Lưu
          </h1>
          <p className="text-base text-outline mt-1 font-light">
            Quản lý thông tin định danh nhận phòng nhanh, mật khẩu bảo mật và đặc quyền hội viên VIP.
          </p>
        </div>

        {/* Metal Member Card Banner */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 relative overflow-hidden rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#020617] text-white shadow-2xl border border-amber-500/30">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-start mb-12">
              <div className="space-y-1">
                <span className="font-sans text-xl font-black tracking-wider text-amber-300">
                  VIETSAGE BOOKING
                </span>
                <p className="text-[9px] uppercase tracking-[0.3em] text-amber-200/60 font-semibold">
                  Hội Viên Thân Thiết
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
                <Crown className="w-3.5 h-3.5" />
                <span>THÀNH VIÊN VIP</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="font-mono text-xl sm:text-2xl tracking-widest text-slate-200">
                VSB • MEMBER • 2026
              </div>

              <div className="flex justify-between items-end pt-4 border-t border-slate-700/60 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Chủ sở hữu thẻ</span>
                  <span className="font-bold text-base text-white">{session.user?.name || 'Quý khách'}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Trạng thái</span>
                  <span className="font-sans font-bold text-amber-300 text-base">Đang Hoạt Động</span>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-5 space-y-4">
            <h3 className="text-lg font-sans font-bold text-on-surface">Đặc Quyền Của Quý Khách</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-on-surface">Fast Check-in không cần chờ</span>
                  <p className="text-outline mt-0.5">Ưu tiên nhận phòng tại quầy VIP Lounge riêng biệt.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                <PhoneCall className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-on-surface">Quản gia cá nhân 24/7</span>
                  <p className="text-outline mt-0.5">Hỗ trợ riêng về phương tiện đưa đón và dịch vụ phòng.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                <CreditCard className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-on-surface">Giảm 15% Dịch Vụ Spa &amp; Tour</span>
                  <p className="text-outline mt-0.5">Áp dụng trực tiếp cho tất cả khu nghỉ dưỡng trong hệ thống.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Settings & Change Password Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {/* Profile Form */}
          <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/40 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-container/20 text-primary flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface">Thông Tin Cá Nhân</h3>
                <p className="text-xs text-outline">Dùng để tự động điền hồ sơ nhận phòng</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">Họ và Tên</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary text-base text-on-surface bg-surface-container-low"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">Địa chỉ Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary text-base text-on-surface bg-surface-container-low"
                  required
                />
              </div>

              {profileMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    profileMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {profileMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={profileLoading}
                className="w-full h-11 rounded-full bg-primary text-on-primary font-bold text-xs hover:bg-primary-container hover:text-on-primary-container transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {profileLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/40 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-container/20 text-primary flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface">Bảo Mật &amp; Đổi Mật Khẩu</h3>
                <p className="text-xs text-outline">Bảo vệ tài khoản và lịch sử đặt phòng</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">Mật Khẩu Hiện Tại</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary text-base text-on-surface bg-surface-container-low"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">Mật Khẩu Mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary text-base text-on-surface bg-surface-container-low"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">Xác Nhận Mật Khẩu Mới</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary text-base text-on-surface bg-surface-container-low"
                  required
                />
              </div>

              {passwordMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    passwordMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {passwordMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full h-11 rounded-full bg-primary text-on-primary font-bold text-xs hover:bg-primary-container hover:text-on-primary-container transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {passwordLoading ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}
              </button>
            </form>
          </div>
        </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data: session, status: authStatus } = useSession();

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="w-full flex-1">
        <div className="max-w-md mx-auto my-20 p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/40 text-center shadow-lg space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary-container/20 text-primary flex items-center justify-center mx-auto">
            <Crown className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-sans font-extrabold text-on-surface">Đặc Quyền Hội Viên VIP</h2>
          <p className="text-base text-outline">
            Vui lòng đăng nhập để quản lý hồ sơ và xem thông tin thẻ hội viên VietSage Booking VIP.
          </p>
          <UserMenu />
        </div>
      </div>
    );
  }

  return <ProfileContent session={session} key={session.user?.email || 'authenticated'} />;
}


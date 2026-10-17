'use client';

import React, { useState } from 'react';
import {
  Building2,
  Printer,
  UserPlus,
  PlusCircle,
  Sparkles,
  Thermometer,
  Wine,
  CheckCircle2,
  ArrowRight,
  ClipboardCheck,
  Flame,
  Diamond,
  Car,
  ShieldCheck,
  ChevronRight,
  Droplets,
} from 'lucide-react';
import { luxuryAlert } from '@/lib/alert/luxury-alert';

type RoomFilterZone = 'ALL' | 'BEACHFRONT' | 'HILLTOP' | 'HERITAGE';

export default function AdminPropertiesPage() {
  const [activeZone, setActiveZone] = useState<RoomFilterZone>('ALL');

  const handlePrintChecklist = () => {
    luxuryAlert.info({
      title: 'Xuất Bảng Kiểm Tiêu Chuẩn 5 Sao',
      message: 'Hệ thống đang chuẩn bị mẫu kiểm định 74 tiêu chuẩn Forbes Travel Guide (Độ sạch ga lụa, áp suất vòi sen, nhiệt độ rượu vang). Tệp in đã sẵn sàng.',
    });
  };

  const handleAssignStaff = () => {
    luxuryAlert.info({
      title: 'Phân Công Nhân Sự Buồng Phòng',
      message: 'Hiện có 18 chuyên viên buồng phòng và 6 quản gia VIP đang trong ca trực. Quý quản lý có thể điều phối nhân sự theo từng phân khu villa.',
    });
  };

  const handleAddVilla = () => {
    luxuryAlert.info({
      title: 'Thêm Phòng / Villa Mới',
      message: 'Tính năng bổ sung hạng phòng mới thuộc thẩm quyền đồng bộ danh mục cơ sở lưu trú từ PMS VietSage qua cổng quản trị đối tác.',
    });
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
      {/* 1. TOP COMMAND & BREADCRUMB RIBBON */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-outline text-[11px] font-bold uppercase tracking-widest">
              <span>Resort Operation</span>
              <ChevronRight className="w-3.5 h-3.5 text-outline-variant" />
              <span className="text-primary font-extrabold">Housekeeping &amp; Villa Master Plan</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              Quản Lý Buồng Phòng &amp; Sơ Đồ Biệt Thự
            </h1>

            <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
              Giám sát trạng thái phòng thời gian thực, tiến trình làm sạch chuẩn mực 5 sao quốc tế và điều phối tiện nghi đặc quyền tại Aurum Sunset Sanctuary Phú Quốc.
            </p>
          </div>

          {/* Action Cluster */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={handlePrintChecklist}
              className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-2xl transition-all shadow-2xs text-xs font-bold cursor-pointer"
            >
              <Printer className="w-4 h-4 text-primary" />
              <span>In Bảng Kiểm 5 Sao</span>
            </button>

            <button
              onClick={handleAssignStaff}
              className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-2xl transition-all shadow-2xs text-xs font-bold cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-primary" />
              <span>Phân Công Nhân Sự</span>
            </button>

            <button
              onClick={handleAddVilla}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-on-primary rounded-2xl transition-all shadow-xs text-xs font-bold cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Thêm Phòng / Villa</span>
            </button>
          </div>
        </div>

        {/* 2. SEGMENT SWITCHER & PROPERTY BAR */}
        <div className="bg-surface-container-low rounded-3xl p-4 sm:p-5 border border-outline-variant/30 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center flex-wrap gap-3 sm:gap-4">
            {/* Sanctuary Location Tag */}
            <div className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-2xl border border-outline-variant/30 shadow-2xs">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-on-surface">Aurum Sunset Sanctuary Phú Quốc</span>
              <span className="text-[10px] text-primary font-bold px-2 py-0.5 bg-primary-container/20 rounded-full">
                Đảo Ngọc
              </span>
            </div>

            {/* Section Quick Filters */}
            <div className="flex items-center bg-surface-container p-1 rounded-2xl text-xs font-bold">
              {[
                { id: 'ALL', label: 'Toàn Bộ Phân Khu' },
                { id: 'BEACHFRONT', label: 'Khu Bờ Biển' },
                { id: 'HILLTOP', label: 'Dinh Thự Trên Đồi' },
                { id: 'HERITAGE', label: 'Suite Di Sản' },
              ].map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => setActiveZone(zone.id as RoomFilterZone)}
                  className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                    activeZone === zone.id
                      ? 'bg-surface-container-lowest text-primary shadow-xs font-black'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {zone.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Sync Marker */}
          <div className="flex items-center gap-2 text-outline text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            <span>Cập nhật trực tiếp: 14:28:10 • 74/74 Điểm Kiểm Tra</span>
          </div>
        </div>

        {/* 3. STATUS LEGEND & KPI PILLS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Occupied */}
          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-on-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Đang Có Khách</span>
                <span className="text-xl font-black text-on-surface">42</span>
              </div>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-black">
              57%
            </span>
          </div>

          {/* Vacant Clean */}
          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-tertiary flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-on-tertiary" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Sạch • Sẵn Sàng</span>
                <span className="text-xl font-black text-on-surface">18</span>
              </div>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-black">
              24%
            </span>
          </div>

          {/* Cleaning In Progress */}
          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-secondary flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-on-secondary" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Đang Vệ Sinh</span>
                <span className="text-xl font-black text-on-surface">08</span>
              </div>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-black">
              11%
            </span>
          </div>

          {/* Inspection Required */}
          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-primary-container flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-on-primary-container" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Chờ Duyệt 5 Sao</span>
                <span className="text-xl font-black text-on-surface">04</span>
              </div>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-black">
              5%
            </span>
          </div>

          {/* Maintenance */}
          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-rose-500 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Bảo Trì / Khóa</span>
                <span className="text-xl font-black text-on-surface">02</span>
              </div>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black">
              3%
            </span>
          </div>
        </div>
      </div>

      {/* 4. DUAL COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* LEFT COLUMN: INTERACTIVE VILLA FLOOR GRID (8 Columns) */}
        <div className="xl:col-span-8 flex flex-col gap-8">
          {/* ZONE 1: Sunset Oceanfront Villas */}
          {(activeZone === 'ALL' || activeZone === 'BEACHFRONT') && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <Droplets className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-on-surface">Dãy Sunset Oceanfront Villas</h2>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface-container-high text-outline font-semibold">
                    Bờ biển phía Tây • 4 Căn
                  </span>
                </div>
                <span className="text-xs font-bold text-primary">100% Khai thác</span>
              </div>

              {/* 4 Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Villa 101: Occupied VIP Diamond */}
                <div className="bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/30 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-on-surface">Villa 101</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-black uppercase">
                            Occupied
                          </span>
                        </div>
                        <span className="text-xs text-outline font-medium">Private Pool Beachfront • 240 m²</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-extrabold uppercase">
                        DND
                      </span>
                    </div>

                    {/* Guest Profile Meta */}
                    <div className="bg-surface-container-low/70 rounded-2xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-black">
                          HK
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-on-surface">Hoàng Kim</span>
                            <Sparkles className="w-3 h-3 text-primary" />
                          </div>
                          <span className="text-[10px] text-primary font-bold">VIP Diamond • Lần thứ 6</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-outline block">Check-out</span>
                        <span className="text-xs font-bold text-on-surface">Mai, 12:00</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium pt-1">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Thermometer className="w-3.5 h-3.5 text-tertiary" />
                        <span>22.5°C • 62% Ẩm</span>
                      </span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Wine className="w-3.5 h-3.5 text-primary" />
                        <span>Quầy bar đầy đủ</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-outline-variant/20 text-xs">
                    <span className="text-[11px] text-outline font-medium">Quản gia: Trần Tuấn Khải</span>
                    <button
                      onClick={() =>
                        luxuryAlert.info({
                          title: 'Chi Tiết Biệt Thự 101',
                          message: 'Villa 101: Khách VIP Diamond Hoàng Kim. Nhiệt độ phòng ổn định 22.5°C. Đã bố trí quản gia túc trực riêng.',
                        })
                      }
                      className="text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Chi tiết</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Villa 102: Cleaning in Progress */}
                <div className="bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/30 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-secondary" />
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-on-surface">Villa 102</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-black uppercase">
                            Cleaning
                          </span>
                        </div>
                        <span className="text-xs text-outline font-medium">Oceanfront Sunset Pavilion • 260 m²</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-extrabold">
                        Đón 13:30
                      </span>
                    </div>

                    {/* Cleaning Progress Track */}
                    <div className="bg-surface-container-low/70 rounded-2xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-[11px] text-on-surface">Chuyên viên: Thu Hương (Tổ 1)</span>
                        <span className="text-secondary font-black text-[11px]">75% Hoàn tất</span>
                      </div>
                      <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                        <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: '75%' }} />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-outline font-medium">
                        <span>1. Khử khuẩn Ion</span>
                        <span>2. Thay lụa cao cấp</span>
                        <span className="text-secondary font-bold">3. Xịt hương gỗ trầm</span>
                      </div>
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Đang hoàn tất khử khuẩn buồng ngủ Master và chuẩn bị rượu chào mừng Champagne Armand de Brignac.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-outline-variant/20 text-xs">
                    <span className="text-[11px] text-outline font-medium">Ước tính: Còn 18 phút</span>
                    <button
                      onClick={() =>
                        luxuryAlert.info({
                          title: 'Tiến Trình Làm Sạch Villa 102',
                          message: 'Bước 3/3 đang diễn ra. Dự kiến bàn giao phòng lúc 13:15, sớm 15 phút trước giờ nhận phòng của khách.',
                        })
                      }
                      className="text-secondary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Xem quy trình</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Villa 103: Forbes 5-Star Clean */}
                <div className="bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/30 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-tertiary" />
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-on-surface">Villa 103</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-black uppercase">
                            Forbes Clean
                          </span>
                        </div>
                        <span className="text-xs text-outline font-medium">Sunset Horizon Pool Villa • 240 m²</span>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="bg-surface-container-low/70 rounded-2xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="w-5 h-5 text-tertiary" />
                        <div>
                          <span className="text-xs font-bold text-on-surface block">Sẵn Sàng Đón Khách</span>
                          <span className="text-[10px] text-outline">Giám Sát: Mai Phương</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-tertiary px-2 py-0.5 rounded-full bg-surface-container">
                        100/100 Điểm
                      </span>
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Hoa lan hồ điệp tươi đã bài trí, nhiệt độ phòng mặc định 21°C, sẵn sàng đón khách lúc 14:00.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-outline-variant/20 text-xs">
                    <span className="text-[11px] text-outline font-medium">Sẵn sàng nhận khách</span>
                    <button
                      onClick={() =>
                        luxuryAlert.toast('Phòng 103 đã hoàn tất kiểm định 5 sao và sẵn sàng nhận phòng', 'success')
                      }
                      className="px-3 py-1 bg-tertiary text-on-tertiary rounded-xl text-xs font-bold shadow-2xs hover:bg-tertiary/90 cursor-pointer"
                    >
                      Bàn Giao Check-in
                    </button>
                  </div>
                </div>

                {/* Villa 104: Occupied VIP Gold */}
                <div className="bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/30 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-on-surface">Villa 104</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-black uppercase">
                            Occupied
                          </span>
                        </div>
                        <span className="text-xs text-outline font-medium">Sunset Oceanfront Villa • 240 m²</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-container/30 text-on-primary-container font-extrabold uppercase">
                        VIP Gold
                      </span>
                    </div>

                    <div className="bg-surface-container-low/70 rounded-2xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-black">
                          DH
                        </div>
                        <div>
                          <span className="text-xs font-bold text-on-surface block">David Harrison</span>
                          <span className="text-[10px] text-primary font-bold">VIP Gold • Tiệc trà 16:30</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-outline block">Check-out</span>
                        <span className="text-xs font-bold text-on-surface">26 Th10</span>
                      </div>
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Yêu cầu quản gia hỗ trợ trà chiều Earl Grey và trái cây tươi nhiệt đới trước 16:30.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-outline-variant/20 text-xs">
                    <span className="text-[11px] text-outline font-medium">Quản gia: Lê Minh Tuấn</span>
                    <button
                      onClick={() =>
                        luxuryAlert.info({
                          title: 'Biệt Thự 104 - Yêu Cầu Quản Gia',
                          message: 'Đã phân công Quản gia Lê Minh Tuấn chuẩn bị trà chiều lúc 16:15 tại hiên ngắm hoàng hôn.',
                        })
                      }
                      className="text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Xem lịch trà</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ZONE 2: Dinh Thự Trên Đồi (Hilltop Sanctuary) */}
          {(activeZone === 'ALL' || activeZone === 'HILLTOP') && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <Flame className="w-5 h-5 text-amber-600" />
                  <h2 className="text-lg font-bold text-on-surface">Dinh Thự Trên Đồi (Hilltop Sanctuary)</h2>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface-container-high text-outline font-semibold">
                    Đỉnh đồi ngắm vịnh • 3 Căn
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-700">1 Sẵn sàng • 2 Có khách</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-on-surface">Villa 201</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold uppercase">
                      Sẵn Sàng
                    </span>
                  </div>
                  <span className="text-[11px] text-outline block">Panoramic Bay Suite • 320 m²</span>
                  <div className="pt-2 flex justify-between text-xs text-on-surface-variant font-medium">
                    <span>20.5°C</span>
                    <span className="text-emerald-700 font-bold">100/100 Điểm</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-on-surface">Villa 202</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-extrabold uppercase">
                      Có Khách
                    </span>
                  </div>
                  <span className="text-[11px] text-outline block">Panoramic Bay Suite • 320 m²</span>
                  <div className="pt-2 flex justify-between text-xs text-on-surface-variant font-medium">
                    <span>VIP Silver</span>
                    <span className="text-primary font-bold">Check-out 12:00</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-on-surface">Villa 203</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-extrabold uppercase">
                      Có Khách
                    </span>
                  </div>
                  <span className="text-[11px] text-outline block">Royal Hilltop Palace • 500 m²</span>
                  <div className="pt-2 flex justify-between text-xs text-on-surface-variant font-medium">
                    <span>VIP Diamond</span>
                    <span className="text-primary font-bold">Quản gia 24/7</span>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN: HOUSEKEEPING & VIP COORDINATION (4 Columns) */}
        <div className="xl:col-span-4 space-y-6">
          {/* VIP Personalized Requests Queue */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Diamond className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base text-on-surface">Hàng Đợi Yêu Cầu VIP</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-container/20 text-primary font-extrabold">
                Live Dispatch
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-surface-container-low/60 border border-outline-variant/20 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-on-surface">Villa 101 • Hoàng Kim</span>
                  <span className="text-primary">14:00</span>
                </div>
                <p className="text-xs text-outline">Bổ sung 2 chai Champagne Moët &amp; Chandon ướp đá tại hồ bơi riêng.</p>
                <div className="flex items-center gap-1 text-[10px] text-tertiary font-bold pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đã chuyển Bartender &amp; Quản gia</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-container-low/60 border border-outline-variant/20 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-on-surface">Ocean Suite 104 • Harrison</span>
                  <span className="text-primary">15:15</span>
                </div>
                <p className="text-xs text-outline">Xe Bentley đón từ Cảng Hàng Không Quốc Tế Phú Quốc về sảnh VIP.</p>
                <div className="flex items-center gap-1 text-[10px] text-primary font-bold pt-1">
                  <Car className="w-3.5 h-3.5" />
                  <span>Tài xế Nguyễn Văn Long đang đón</span>
                </div>
              </div>
            </div>
          </div>

          {/* Housekeeping Team Roster */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-tertiary" />
                <h3 className="font-bold text-base text-on-surface">Đội Ngũ Ca Trực Hôm Nay</h3>
              </div>
              <span className="text-xs font-bold text-tertiary">24 Nhân Sự</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low/50">
                <div>
                  <span className="font-bold text-on-surface block">Tổ 1: Cụm Oceanfront</span>
                  <span className="text-[10px] text-outline">Thu Hương (Trưởng tổ) • 6 chuyên viên</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700">Đang dọn 102</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low/50">
                <div>
                  <span className="font-bold text-on-surface block">Tổ 2: Cụm Hilltop Sanctuary</span>
                  <span className="text-[10px] text-outline">Mai Phương (Trưởng tổ) • 8 chuyên viên</span>
                </div>
                <span className="text-[11px] font-bold text-tertiary">Sẵn sàng 100%</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low/50">
                <div>
                  <span className="font-bold text-on-surface block">Tổ Quản Gia VIP Concierge</span>
                  <span className="text-[10px] text-outline">Trần Tuấn Khải • 6 quản gia 24/7</span>
                </div>
                <span className="text-[11px] font-bold text-primary">Túc trực VIP</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

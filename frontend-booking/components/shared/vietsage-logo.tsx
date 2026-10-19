import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export type VietSageLogoVariant = 'horizontal' | 'vertical' | 'mark' | 'text';
export type VietSageLogoSize = 'sm' | 'md' | 'lg' | 'xl';

export interface VietSageLogoProps {
  /**
   * Layout presentation variant:
   * - 'horizontal': Logo mark beside text (default for headers, footers, toolbars)
   * - 'vertical': Logo mark centered on top of text (ideal for login cards, splash, hero)
   * - 'mark': Logo mark only (squircle icon)
   * - 'text': Typography only ("VietSageBooking")
   */
  variant?: VietSageLogoVariant;
  /**
   * Size presets:
   * - 'sm': mark 32px (compact toolbars, mobile navbars)
   * - 'md': mark 44px (standard desktop header)
   * - 'lg': mark 56px (prominent display, admin sidebar)
   * - 'xl': mark 84px (hero, login splash)
   */
  size?: VietSageLogoSize;
  /**
   * Whether to include the secondary tagline: "Đặt Phòng & Nghỉ Dưỡng Trực Tuyến"
   * Default: true for 'vertical', false for 'horizontal' / 'text'
   */
  showSubtitle?: boolean;
  /**
   * Whether to prioritize image loading (useful for above-the-fold headers)
   */
  priority?: boolean;
  /**
   * Additional container CSS classes
   */
  className?: string;
  /**
   * If true, wraps the logo in a Next.js Link to homepage '/'
   */
  asLink?: boolean;
  /**
   * Optional custom onClick handler
   */
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}

const SIZE_CONFIG = {
  sm: {
    mark: { width: 32, height: 32 },
    textTitle: { width: 135, height: 17 },
    textFull: { width: 145, height: 26 },
    vertical: { width: 180, height: 106 },
  },
  md: {
    mark: { width: 44, height: 44 },
    textTitle: { width: 175, height: 22 },
    textFull: { width: 185, height: 33 },
    vertical: { width: 230, height: 136 },
  },
  lg: {
    mark: { width: 56, height: 56 },
    textTitle: { width: 220, height: 28 },
    textFull: { width: 235, height: 42 },
    vertical: { width: 290, height: 171 },
  },
  xl: {
    mark: { width: 84, height: 84 },
    textTitle: { width: 310, height: 39 },
    textFull: { width: 330, height: 59 },
    vertical: { width: 340, height: 201 },
  },
};

export function VietSageLogo({
  variant = 'horizontal',
  size = 'md',
  showSubtitle,
  priority = false,
  className = '',
  asLink = false,
  onClick,
}: VietSageLogoProps) {
  const config = SIZE_CONFIG[size];
  const hasSubtitle = showSubtitle ?? (variant === 'vertical');

  let content: React.ReactNode = null;

  switch (variant) {
    case 'mark':
      content = (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
          <Image
            src="/images/vietsage-logo-mark.png"
            alt="VietSage Logo Mark"
            width={config.mark.width}
            height={config.mark.height}
            priority={priority}
            style={{ width: `${config.mark.width}px`, height: `${config.mark.height}px` }}
            className="shrink-0 object-contain drop-shadow-2xs transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      );
      break;

    case 'text':
      content = (
        <div className={`relative inline-flex flex-col justify-center shrink-0 ${className}`}>
          {hasSubtitle ? (
            <>
              {/* Responsive fallback: full on sm+, compact title on mobile */}
              <div className="hidden sm:block shrink-0">
                <Image
                  src="/images/vietsage-logo-text-full.png"
                  alt="VietSageBooking - Đặt Phòng & Nghỉ Dưỡng Trực Tuyến"
                  width={config.textFull.width}
                  height={config.textFull.height}
                  priority={priority}
                  style={{ height: `${config.textFull.height}px`, width: 'auto' }}
                  className="shrink-0 object-contain"
                />
              </div>
              <div className="block sm:hidden shrink-0">
                <Image
                  src="/images/vietsage-logo-text.png"
                  alt="VietSageBooking"
                  width={config.textTitle.width}
                  height={config.textTitle.height}
                  priority={priority}
                  style={{ height: `${config.textTitle.height}px`, width: 'auto' }}
                  className="shrink-0 object-contain"
                />
              </div>
            </>
          ) : (
            <Image
              src="/images/vietsage-logo-text.png"
              alt="VietSageBooking"
              width={config.textTitle.width}
              height={config.textTitle.height}
              priority={priority}
              style={{ height: `${config.textTitle.height}px`, width: 'auto' }}
              className="shrink-0 object-contain"
            />
          )}
        </div>
      );
      break;

    case 'vertical':
      content = (
        <div className={`flex flex-col items-center justify-center text-center shrink-0 ${className}`}>
          <Image
            src="/images/vietsage-logo-vertical.png"
            alt="VietSageBooking - Đặt Phòng & Nghỉ Dưỡng Trực Tuyến"
            width={config.vertical.width}
            height={config.vertical.height}
            priority={priority}
            style={{ width: `${config.vertical.width}px`, height: `${config.vertical.height}px` }}
            className="shrink-0 object-contain drop-shadow-xs transition-transform duration-300 group-hover:scale-102"
          />
        </div>
      );
      break;

    case 'horizontal':
    default:
      content = (
        <div className={`inline-flex items-center gap-2.5 sm:gap-3.5 shrink-0 ${className}`}>
          {/* Logo Mark Squircle */}
          <div className="relative shrink-0 flex items-center justify-center">
            <Image
              src="/images/vietsage-logo-mark.png"
              alt="VietSage Logo"
              width={config.mark.width}
              height={config.mark.height}
              priority={priority}
              style={{ width: `${config.mark.width}px`, height: `${config.mark.height}px` }}
              className="shrink-0 object-contain drop-shadow-2xs transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          {/* Stylized Typography */}
          <div className="flex flex-col justify-center shrink-0">
            {hasSubtitle ? (
              <>
                <div className="hidden sm:block shrink-0">
                  <Image
                    src="/images/vietsage-logo-text-full.png"
                    alt="VietSageBooking - Đặt Phòng & Nghỉ Dưỡng Trực Tuyến"
                    width={config.textFull.width}
                    height={config.textFull.height}
                    priority={priority}
                    style={{ height: `${config.textFull.height}px`, width: 'auto' }}
                    className="shrink-0 object-contain"
                  />
                </div>
                <div className="block sm:hidden shrink-0">
                  <Image
                    src="/images/vietsage-logo-text.png"
                    alt="VietSageBooking"
                    width={config.textTitle.width}
                    height={config.textTitle.height}
                    priority={priority}
                    style={{ height: `${config.textTitle.height}px`, width: 'auto' }}
                    className="shrink-0 object-contain"
                  />
                </div>
              </>
            ) : (
              <Image
                src="/images/vietsage-logo-text.png"
                alt="VietSageBooking"
                width={config.textTitle.width}
                height={config.textTitle.height}
                priority={priority}
                style={{ height: `${config.textTitle.height}px`, width: 'auto' }}
                className="shrink-0 object-contain"
              />
            )}
          </div>
        </div>
      );
      break;
  }

  if (asLink) {
    return (
      <Link
        href="/"
        onClick={onClick}
        className="group inline-flex items-center shrink-0 text-inherit no-underline focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl"
        aria-label="VietSageBooking - Trang chủ"
      >
        {content}
      </Link>
    );
  }

  return (
    <div onClick={onClick} className={onClick ? 'cursor-pointer group' : 'group'}>
      {content}
    </div>
  );
}

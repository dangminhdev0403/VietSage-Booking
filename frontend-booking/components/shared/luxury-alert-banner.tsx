'use client';

import React from 'react';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Sparkles, Info } from 'lucide-react';

export type AlertVariant = 'privilege' | 'success' | 'warning' | 'error' | 'info';

export interface LuxuryAlertBannerProps {
  variant?: AlertVariant;
  title?: string;
  description?: React.ReactNode;
  badgeText?: string;
  code?: string;
  actionText?: string;
  onAction?: () => void;
  onClose?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function LuxuryAlertBanner({
  variant = 'info',
  title,
  description,
  badgeText,
  code,
  actionText,
  onAction,
  onClose,
  className = '',
  children,
}: LuxuryAlertBannerProps) {
  if (variant === 'privilege') {
    return (
      <div
        role="alert"
        className={`p-3.5 sm:p-5 rounded-2xl bg-gradient-to-r from-[#211b14] via-[#1a1510] to-[#241c14] border border-[#c5a880]/40 shadow-sm relative overflow-hidden text-white flex ${title ? 'items-start' : 'items-center'} gap-3.5 sm:gap-4 transition-all ${className}`}
      >
        <div className={`p-2 sm:p-2.5 rounded-xl bg-[#c5a880]/20 text-[#c5a880] shrink-0 border border-[#c5a880]/30 ${title ? 'mt-0.5' : ''}`}>
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-1 min-w-0">
          {title && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-sans text-base sm:text-lg font-semibold tracking-wide text-[#fedeb2]">
                {title}
              </span>
              {badgeText && (
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-[#c5a880] text-[#0f172a]">
                  {badgeText}
                </span>
              )}
            </div>
          )}
          {(description || children) && (
            <div className={`text-xs sm:text-base text-slate-300 ${title ? 'leading-relaxed font-normal' : 'font-medium leading-normal'}`}>
              {description || children}
            </div>
          )}
          {code && (
            <div className="pt-1">
              <span className="font-mono text-xs font-bold text-[#fedeb2] bg-white/10 px-2 py-1 rounded-md border border-[#c5a880]/20">
                {code}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {actionText && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#c5a880] text-[#0f172a] hover:bg-[#fedeb2] transition-colors cursor-pointer"
            >
              {actionText}
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              aria-label="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'success') {
    return (
      <div
        role="alert"
        className={`p-3.5 sm:p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 shadow-sm flex ${title ? 'items-start' : 'items-center'} gap-3 sm:gap-4 text-emerald-950 transition-all ${className}`}
      >
        <div className={`p-2 sm:p-2.5 rounded-xl bg-emerald-100/90 text-emerald-700 shrink-0 border border-emerald-300/70 ${title ? 'mt-0.5' : ''}`}>
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-1 min-w-0">
          {title && (
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-base font-bold text-emerald-900 tracking-tight">
                {title}
              </h4>
              {badgeText && (
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-emerald-200 text-emerald-900">
                  {badgeText}
                </span>
              )}
            </div>
          )}
          {(description || children) && (
            <div className={`text-xs sm:text-base text-emerald-800/90 ${title ? 'leading-relaxed font-normal' : 'font-medium leading-normal'}`}>
              {description || children}
            </div>
          )}
          {code && (
            <div className="pt-1">
              <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100/80 px-2 py-1 rounded-md border border-emerald-300/60">
                {code}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {actionText && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-sm cursor-pointer"
            >
              {actionText}
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-emerald-500 hover:text-emerald-800 transition-colors p-1 rounded-lg hover:bg-emerald-100/60 cursor-pointer"
              aria-label="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'warning') {
    return (
      <div
        role="alert"
        className={`p-3.5 sm:p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 shadow-sm flex ${title ? 'items-start' : 'items-center'} gap-3 sm:gap-4 text-amber-950 transition-all ${className}`}
      >
        <div className={`p-2 sm:p-2.5 rounded-xl bg-amber-100/90 text-amber-700 shrink-0 border border-amber-300/70 ${title ? 'mt-0.5' : ''}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-1 min-w-0">
          {title && (
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-base font-bold text-amber-900 tracking-tight">
                {title}
              </h4>
              {badgeText && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-200 text-amber-900">
                  {badgeText}
                </span>
              )}
            </div>
          )}
          {(description || children) && (
            <div className={`text-xs sm:text-base text-amber-900/85 ${title ? 'leading-relaxed font-normal' : 'font-medium leading-normal'}`}>
              {description || children}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {actionText && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-900 text-white hover:bg-amber-950 transition-colors shadow-sm cursor-pointer"
            >
              {actionText}
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-amber-500 hover:text-amber-800 transition-colors p-1 rounded-lg hover:bg-amber-100/60 cursor-pointer"
              aria-label="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'error') {
    return (
      <div
        role="alert"
        className={`p-3.5 sm:p-4 rounded-2xl bg-rose-50/85 border border-rose-200 shadow-sm flex ${title ? 'items-start' : 'items-center'} gap-3 sm:gap-4 text-rose-950 transition-all ${className}`}
      >
        <div className={`p-2 sm:p-2.5 rounded-xl bg-rose-100/90 text-rose-700 shrink-0 border border-rose-300/70 ${title ? 'mt-0.5' : ''}`}>
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-1 min-w-0">
          {title && (
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-base font-bold text-rose-900 tracking-tight">
                {title}
              </h4>
              {badgeText && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-200 text-rose-900">
                  {badgeText}
                </span>
              )}
            </div>
          )}
          {(description || children) && (
            <div className={`text-xs sm:text-base text-rose-800 ${title ? 'leading-relaxed font-normal' : 'font-medium leading-normal'}`}>
              {description || children}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {actionText && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-700 text-white hover:bg-rose-800 transition-colors shadow-sm cursor-pointer"
            >
              {actionText}
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-rose-500 hover:text-rose-800 transition-colors p-1 rounded-lg hover:bg-rose-100/60 cursor-pointer"
              aria-label="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Info variant
  return (
    <div
      role="alert"
      className={`p-3.5 sm:p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 shadow-sm flex ${title ? 'items-start' : 'items-center'} gap-3 sm:gap-4 text-on-surface transition-all ${className}`}
    >
      <div className={`p-2 sm:p-2.5 rounded-xl bg-primary-container/20 text-primary shrink-0 border border-primary-container/30 ${title ? 'mt-0.5' : ''}`}>
        <Info className="w-5 h-5" />
      </div>
      <div className="flex-1 space-y-1 min-w-0">
        {title && (
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-bold text-on-surface tracking-tight">
              {title}
            </h4>
            {badgeText && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-surface-container text-on-surface-variant">
                {badgeText}
              </span>
            )}
          </div>
        )}
        {(description || children) && (
          <div className={`text-xs sm:text-base text-on-surface-variant ${title ? 'leading-relaxed font-normal' : 'font-medium leading-normal'}`}>
            {description || children}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {actionText && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
          >
            {actionText}
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-outline hover:text-on-surface transition-colors p-1 rounded-lg hover:bg-surface-container cursor-pointer"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default LuxuryAlertBanner;

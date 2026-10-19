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
        className={`p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-[#c5a880]/30 shadow-sm relative overflow-hidden text-white flex ${title ? 'items-start' : 'items-center'} gap-3 sm:gap-3.5 transition-all ${className}`}
      >
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#c5a880]/15 text-[#eed6b8] shrink-0 border border-[#c5a880]/25 flex items-center justify-center ${title ? 'mt-0.5' : ''}`}>
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1 space-y-1 min-w-0">
          {title && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-sans text-sm sm:text-base font-semibold tracking-tight text-[#f5e6d3] text-balance">
                {title}
              </span>
              {badgeText && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#c5a880]/20 text-[#eed6b8] border border-[#c5a880]/30 whitespace-nowrap">
                  {badgeText}
                </span>
              )}
            </div>
          )}
          {(description || children) && (
            <div className={`text-xs sm:text-sm text-slate-300 text-pretty ${title ? 'leading-relaxed font-normal' : 'font-medium leading-normal'}`}>
              {description || children}
            </div>
          )}
          {code && (
            <div className="pt-1">
              <span className="font-mono text-xs font-medium text-[#eed6b8] bg-white/10 px-2 py-0.5 rounded-md border border-[#c5a880]/25">
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
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#c5a880] text-slate-950 hover:bg-[#d6be99] transition-colors whitespace-nowrap cursor-pointer shadow-xs"
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
        className={`p-3.5 sm:p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 shadow-xs flex ${title ? 'items-start' : 'items-center'} gap-3 sm:gap-3.5 text-emerald-950 transition-all ${className}`}
      >
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100/70 text-emerald-700 shrink-0 border border-emerald-200/60 flex items-center justify-center ${title ? 'mt-0.5' : ''}`}>
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="flex-1 space-y-1 min-w-0">
          {title && (
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm sm:text-base font-semibold text-emerald-950 tracking-tight text-balance">
                {title}
              </h4>
              {badgeText && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/60 whitespace-nowrap">
                  {badgeText}
                </span>
              )}
            </div>
          )}
          {(description || children) && (
            <div className={`text-xs sm:text-sm text-emerald-900/80 text-pretty ${title ? 'leading-relaxed font-normal' : 'font-medium leading-normal'}`}>
              {description || children}
            </div>
          )}
          {code && (
            <div className="pt-1">
              <span className="font-mono text-xs font-medium text-emerald-950 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200/70">
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
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 transition-colors shadow-xs whitespace-nowrap cursor-pointer"
            >
              {actionText}
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-emerald-600/70 hover:text-emerald-900 transition-colors p-1 rounded-lg hover:bg-emerald-100/60 cursor-pointer"
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
        className={`p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 shadow-xs flex ${title ? 'items-start' : 'items-center'} gap-3 sm:gap-3.5 text-amber-950 transition-all ${className}`}
      >
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-100/70 text-amber-800 shrink-0 border border-amber-200/60 flex items-center justify-center ${title ? 'mt-0.5' : ''}`}>
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="flex-1 space-y-1 min-w-0">
          {title && (
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm sm:text-base font-semibold text-amber-950 tracking-tight text-balance">
                {title}
              </h4>
              {badgeText && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-200/60 whitespace-nowrap">
                  {badgeText}
                </span>
              )}
            </div>
          )}
          {(description || children) && (
            <div className={`text-xs sm:text-sm text-amber-900/80 text-pretty ${title ? 'leading-relaxed font-normal' : 'font-medium leading-normal'}`}>
              {description || children}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {actionText && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-800 text-white hover:bg-amber-900 transition-colors shadow-xs whitespace-nowrap cursor-pointer"
            >
              {actionText}
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-amber-600/70 hover:text-amber-900 transition-colors p-1 rounded-lg hover:bg-amber-100/60 cursor-pointer"
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
        className={`p-3.5 sm:p-4 rounded-2xl bg-rose-50/70 border border-rose-200/70 shadow-xs flex ${title ? 'items-start' : 'items-center'} gap-3 sm:gap-3.5 text-rose-950 transition-all ${className}`}
      >
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-100/70 text-rose-700 shrink-0 border border-rose-200/60 flex items-center justify-center ${title ? 'mt-0.5' : ''}`}>
          <AlertCircle className="w-4 h-4" />
        </div>
        <div className="flex-1 space-y-1 min-w-0">
          {title && (
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm sm:text-base font-semibold text-rose-950 tracking-tight text-balance">
                {title}
              </h4>
              {badgeText && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-rose-100 text-rose-800 border border-rose-200/60 whitespace-nowrap">
                  {badgeText}
                </span>
              )}
            </div>
          )}
          {(description || children) && (
            <div className={`text-xs sm:text-sm text-rose-900/80 text-pretty ${title ? 'leading-relaxed font-normal' : 'font-medium leading-normal'}`}>
              {description || children}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {actionText && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-700 text-white hover:bg-rose-800 transition-colors shadow-xs whitespace-nowrap cursor-pointer"
            >
              {actionText}
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-rose-600/70 hover:text-rose-900 transition-colors p-1 rounded-lg hover:bg-rose-100/60 cursor-pointer"
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
      className={`p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 shadow-xs flex ${title ? 'items-start' : 'items-center'} gap-3 sm:gap-3.5 text-slate-900 transition-all ${className}`}
    >
      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 text-slate-700 shrink-0 border border-slate-200/70 flex items-center justify-center ${title ? 'mt-0.5' : ''}`}>
        <Info className="w-4 h-4" />
      </div>
      <div className="flex-1 space-y-1 min-w-0">
        {title && (
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight text-balance">
              {title}
            </h4>
            {badgeText && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                {badgeText}
              </span>
            )}
          </div>
        )}
        {(description || children) && (
          <div className={`text-xs sm:text-sm text-slate-600 text-pretty ${title ? 'leading-relaxed font-normal' : 'font-medium leading-normal'}`}>
            {description || children}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {actionText && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs whitespace-nowrap cursor-pointer"
          >
            {actionText}
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
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

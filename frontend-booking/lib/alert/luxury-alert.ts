import Swal, { SweetAlertOptions, SweetAlertResult } from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export interface LuxuryAlertOptions {
  title?: string;
  message?: string;
  text?: string;
  html?: string;
  confirmText?: string;
  cancelText?: string;
  showCancelButton?: boolean;
  timer?: number;
  details?: string[] | unknown;
  customIconHtml?: string;
}

export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'luxury';

// Refined compact duotone icons (44x44px rounded-2xl with hairline rings and 20px crisp paths)
const ICONS = {
  error: `
    <div class="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/80 ring-4 ring-rose-50/60 shadow-xs mx-auto">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    </div>
  `,
  success: `
    <div class="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/80 ring-4 ring-emerald-50/60 shadow-xs mx-auto">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>
    </div>
  `,
  warning: `
    <div class="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/80 ring-4 ring-amber-50/60 shadow-xs mx-auto">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    </div>
  `,
  info: `
    <div class="w-11 h-11 rounded-2xl bg-stone-50 text-stone-700 flex items-center justify-center border border-stone-200/90 ring-4 ring-stone-100/70 shadow-xs mx-auto">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    </div>
  `,
  luxury: `
    <div class="w-11 h-11 rounded-2xl bg-[#faf6f0] text-[#8e6e3c] flex items-center justify-center border border-[#dfceb7] ring-4 ring-[#f4ede1]/80 shadow-xs mx-auto">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    </div>
  `,
};

// Base SweetAlert2 instance styled with Aurum Haven Quiet Luxury tokens
const LuxurySwal = Swal.mixin({
  customClass: {
    container: 'aurum-swal-container',
    popup: 'aurum-swal-popup',
    title: 'aurum-swal-title',
    htmlContainer: 'aurum-swal-html',
    confirmButton: 'aurum-swal-btn-confirm',
    cancelButton: 'aurum-swal-btn-cancel',
    actions: 'aurum-swal-actions',
    footer: 'aurum-swal-footer',
  },
  buttonsStyling: false,
  showClass: {
    popup: 'aurum-swal-show',
  },
  hideClass: {
    popup: 'aurum-swal-hide',
  },
  backdrop: 'rgba(15, 23, 42, 0.45)',
});

// Toast instance for non-blocking corner notifications
const LuxuryToast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 4000,
  timerProgressBar: true,
  customClass: {
    popup: 'aurum-swal-toast',
    title: 'aurum-swal-toast-title',
    htmlContainer: 'aurum-swal-toast-html',
    timerProgressBar: 'aurum-swal-toast-progress',
  },
  showClass: {
    popup: 'aurum-toast-show',
  },
  hideClass: {
    popup: 'aurum-toast-hide',
  },
});

function parseInputOptions(
  input: LuxuryAlertOptions | string,
  fallbackTitle: string,
): { title: string; message: string; options: LuxuryAlertOptions } {
  if (typeof input === 'string') {
    return {
      title: fallbackTitle,
      message: input,
      options: { title: fallbackTitle, message: input },
    };
  }
  return {
    title: input.title || fallbackTitle,
    message: input.message || input.text || '',
    options: input,
  };
}

function buildDetailsHtml(details?: unknown): string {
  if (!details) return '';
  if (Array.isArray(details) && details.length > 0) {
    const listItems = details
      .map((item) => {
        if (typeof item === 'string') {
          return `<li class="flex items-start gap-2"><span class="text-slate-400 select-none text-xs leading-5">•</span><span class="flex-1">${item}</span></li>`;
        }
        if (typeof item === 'object' && item !== null && 'message' in item) {
          const path = 'path' in item && Array.isArray(item.path) ? ` (${item.path.join('.')})` : '';
          return `<li class="flex items-start gap-2"><span class="text-slate-400 select-none text-xs leading-5">•</span><span class="flex-1">${(item as { message: string }).message}${path}</span></li>`;
        }
        return `<li class="flex items-start gap-2"><span class="text-slate-400 select-none text-xs leading-5">•</span><span class="flex-1">${JSON.stringify(item)}</span></li>`;
      })
      .join('');
    return `
      <div class="mt-3.5 p-3 rounded-xl bg-slate-50/90 text-left text-xs text-slate-600 border border-slate-200/80">
        <ul class="space-y-1.5">${listItems}</ul>
      </div>
    `;
  }
  if (typeof details === 'object') {
    return `
      <div class="mt-3.5 p-3 rounded-xl bg-slate-50/90 text-left text-xs text-slate-600 border border-slate-200/80">
        <pre class="font-mono text-xs overflow-x-auto whitespace-pre-wrap">${JSON.stringify(details, null, 2)}</pre>
      </div>
    `;
  }
  return '';
}

/**
 * Format any API or runtime error into friendly, luxury hospitality copy
 */
export function formatApiError(err: unknown): {
  title: string;
  message: string;
  details?: unknown;
} {
  if (!err) {
    return {
      title: 'Đã xảy ra sự cố',
      message: 'Hệ thống tạm thời chưa xử lý được yêu cầu. Quý khách vui lòng thử lại sau giây lát.',
    };
  }

  // Handle ApiClientError or Error
  if (typeof err === 'object' && err !== null) {
    const msg = 'message' in err && typeof err.message === 'string' ? err.message : '';
    const code = 'code' in err && typeof err.code === 'string' ? err.code : '';
    const details = 'details' in err ? err.details : undefined;

    // Specific hospitality mapping
    if (msg.includes('Dữ liệu đặt phòng không hợp lệ') || code === 'BAD_REQUEST') {
      return {
        title: 'Thông Tin Đặt Phòng Cần Điều Chỉnh',
        message: 'Hệ thống nhận thấy một số dữ liệu chưa đúng quy chuẩn (ngày lưu trú, số điện thoại hoặc phòng đã chọn). Quý khách vui lòng kiểm tra lại.',
        details,
      };
    }

    if (code === 'UNAUTHORIZED' || msg.includes('đăng nhập')) {
      return {
        title: 'Yêu Cầu Xác Thực Danh Tính',
        message: 'Phiên làm việc đã hết hạn hoặc chưa đăng nhập. Quý khách vui lòng đăng nhập để tiếp tục đặc quyền.',
        details,
      };
    }

    if (code === 'NOT_FOUND' || msg.includes('không tìm thấy')) {
      return {
        title: 'Không Tìm Thấy Thông Tin',
        message: msg || 'Không tìm thấy hồ sơ hoặc dữ liệu lưu trú theo thông tin cung cấp.',
        details,
      };
    }

    if (msg) {
      return {
        title: 'Thông Báo Từ Hệ Thống',
        message: msg,
        details,
      };
    }
  }

  return {
    title: 'Đã Xảy Ra Gián Đoạn',
    message: String(err),
  };
}

/**
 * Programmatic Luxury Alert Utility
 * Replaces crude window.alert and window.confirm with Aurum Haven Quiet Luxury modals
 */
export const luxuryAlert = {
  /**
   * Display Error Dialog
   */
  async error(
    input: LuxuryAlertOptions | string,
    title = 'Không Thể Hoàn Tất Thao Tác',
  ): Promise<SweetAlertResult> {
    const parsed = parseInputOptions(input, title);
    const detailsHtml = buildDetailsHtml(parsed.options.details);
    const bodyHtml = parsed.options.html || `
      <div class="space-y-2">
        <p class="leading-relaxed text-slate-600 text-pretty">${parsed.message}</p>
        ${detailsHtml}
      </div>
    `;

    return LuxurySwal.fire({
      title: parsed.title,
      html: bodyHtml,
      iconHtml: parsed.options.customIconHtml || ICONS.error,
      confirmButtonText: parsed.options.confirmText || 'Đã hiểu',
      showCancelButton: false,
      timer: parsed.options.timer,
      timerProgressBar: Boolean(parsed.options.timer),
    });
  },

  /**
   * Display Success Dialog
   */
  async success(
    input: LuxuryAlertOptions | string,
    title = 'Thao Tác Thành Công',
  ): Promise<SweetAlertResult> {
    const parsed = parseInputOptions(input, title);
    const detailsHtml = buildDetailsHtml(parsed.options.details);
    const bodyHtml = parsed.options.html || `
      <div class="space-y-2">
        <p class="leading-relaxed text-slate-600 text-pretty">${parsed.message}</p>
        ${detailsHtml}
      </div>
    `;

    return LuxurySwal.fire({
      title: parsed.title,
      html: bodyHtml,
      iconHtml: parsed.options.customIconHtml || ICONS.success,
      confirmButtonText: parsed.options.confirmText || 'Hoàn tất',
      showCancelButton: false,
      timer: parsed.options.timer,
      timerProgressBar: Boolean(parsed.options.timer),
    });
  },

  /**
   * Display Warning Dialog
   */
  async warning(
    input: LuxuryAlertOptions | string,
    title = 'Lưu Ý Quan Trọng',
  ): Promise<SweetAlertResult> {
    const parsed = parseInputOptions(input, title);
    const detailsHtml = buildDetailsHtml(parsed.options.details);
    const bodyHtml = parsed.options.html || `
      <div class="space-y-2">
        <p class="leading-relaxed text-slate-600 text-pretty">${parsed.message}</p>
        ${detailsHtml}
      </div>
    `;

    return LuxurySwal.fire({
      title: parsed.title,
      html: bodyHtml,
      iconHtml: parsed.options.customIconHtml || ICONS.warning,
      confirmButtonText: parsed.options.confirmText || 'Xác nhận tiếp tục',
      showCancelButton: parsed.options.showCancelButton ?? false,
      cancelButtonText: parsed.options.cancelText || 'Quay lại',
      timer: parsed.options.timer,
      timerProgressBar: Boolean(parsed.options.timer),
    });
  },

  /**
   * Display Info or Luxury Announcement Dialog
   */
  async info(
    input: LuxuryAlertOptions | string,
    title = 'Thông Tin Kỳ Nghỉ',
  ): Promise<SweetAlertResult> {
    const parsed = parseInputOptions(input, title);
    const bodyHtml = parsed.options.html || `
      <p class="leading-relaxed text-slate-600 text-pretty">${parsed.message}</p>
    `;

    return LuxurySwal.fire({
      title: parsed.title,
      html: bodyHtml,
      iconHtml: parsed.options.customIconHtml || ICONS.info,
      confirmButtonText: parsed.options.confirmText || 'Đã hiểu',
      showCancelButton: false,
      timer: parsed.options.timer,
      timerProgressBar: Boolean(parsed.options.timer),
    });
  },

  /**
   * Confirmation Dialog (Replaces window.confirm)
   * Resolves to `true` if user confirmed, `false` otherwise
   */
  async confirm(options: {
    title: string;
    message?: string;
    text?: string;
    html?: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
    details?: unknown;
  }): Promise<boolean> {
    const detailsHtml = buildDetailsHtml(options.details);
    const bodyHtml = options.html || `
      <div class="space-y-2">
        <p class="leading-relaxed text-slate-600 text-pretty">${options.message || options.text || ''}</p>
        ${detailsHtml}
      </div>
    `;

    const res = await LuxurySwal.fire({
      title: options.title,
      html: bodyHtml,
      iconHtml: options.isDangerous ? ICONS.error : ICONS.warning,
      showCancelButton: true,
      confirmButtonText: options.confirmText || (options.isDangerous ? 'Xác nhận xóa' : 'Xác nhận'),
      cancelButtonText: options.cancelText || 'Hủy bỏ',
      customClass: {
        confirmButton: options.isDangerous ? 'aurum-swal-btn-danger' : 'aurum-swal-btn-confirm',
        cancelButton: 'aurum-swal-btn-cancel',
      },
      reverseButtons: true,
      focusCancel: true,
    });

    return res.isConfirmed;
  },

  /**
   * Replaces raw floating toasts with customized SweetAlert2 dialogs
   */
  async toast(
    input: LuxuryAlertOptions | string,
    variant: ToastVariant = 'info',
  ): Promise<SweetAlertResult> {
    const options: LuxuryAlertOptions =
      typeof input === 'string'
        ? { message: input, timer: 3500 }
        : { timer: input.timer ?? 3500, ...input };

    if (variant === 'success') {
      return this.success(options, options.title || 'Thao Tác Thành Công');
    }
    if (variant === 'error') {
      return this.error(options, options.title || 'Thông Báo Sự Cố');
    }
    if (variant === 'warning') {
      return this.warning(options, options.title || 'Lưu Ý Quan Trọng');
    }
    return this.info(options, options.title || 'Thông Tin Hệ Thống');
  },

  /**
   * Directly invoke with raw SweetAlert options if ever needed
   */
  fire(options: SweetAlertOptions) {
    return LuxurySwal.fire(options);
  },

  /**
   * Export the format utility for direct use
   */
  formatApiError,
};

export default luxuryAlert;

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

// Icon SVGs extracted from Stitch Aurum Haven UI Kit
const ICONS = {
  error: `
    <div class="w-16 h-16 rounded-full bg-rose-100/90 text-rose-700 flex items-center justify-center border border-rose-300/80 shadow-sm mx-auto">
      <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    </div>
  `,
  success: `
    <div class="w-16 h-16 rounded-full bg-emerald-100/90 text-emerald-700 flex items-center justify-center border border-emerald-300/80 shadow-sm mx-auto">
      <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  `,
  warning: `
    <div class="w-16 h-16 rounded-full bg-amber-100/90 text-amber-700 flex items-center justify-center border border-amber-300/80 shadow-sm mx-auto">
      <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    </div>
  `,
  info: `
    <div class="w-16 h-16 rounded-full bg-[#f5ede2] text-[#a48255] flex items-center justify-center border border-[#c5a880]/50 shadow-sm mx-auto">
      <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    </div>
  `,
  luxury: `
    <div class="w-16 h-16 rounded-full bg-[#f5ede2] text-[#a48255] flex items-center justify-center border border-[#c5a880]/60 shadow-sm mx-auto ring-4 ring-[#c5a880]/15">
      <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
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
  backdrop: 'rgba(15, 23, 42, 0.65)',
});

// Toast instance for non-blocking corner notifications
const LuxuryToast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 4500,
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
        if (typeof item === 'string') return `<li>${item}</li>`;
        if (typeof item === 'object' && item !== null && 'message' in item) {
          const path = 'path' in item && Array.isArray(item.path) ? ` (${item.path.join('.')})` : '';
          return `<li>${(item as { message: string }).message}${path}</li>`;
        }
        return `<li>${JSON.stringify(item)}</li>`;
      })
      .join('');
    return `
      <div class="mt-3 p-3 rounded-xl bg-surface-container-low text-left text-xs text-on-surface-variant border border-outline-variant/30">
        <ul class="list-disc list-inside space-y-1">${listItems}</ul>
      </div>
    `;
  }
  if (typeof details === 'object') {
    return `
      <div class="mt-3 p-3 rounded-xl bg-surface-container-low text-left text-xs text-on-surface-variant border border-outline-variant/30">
        <pre class="font-mono text-xs overflow-x-auto">${JSON.stringify(details, null, 2)}</pre>
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
      confirmButtonText: parsed.options.confirmText || 'Đã hiểu & Kiểm tra lại',
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
      confirmButtonText: parsed.options.confirmText || 'Đã Hiểu',
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
      confirmButtonText: parsed.options.confirmText || 'Đóng thông báo',
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
      confirmButtonText: options.confirmText || 'Xác nhận thực hiện',
      cancelButtonText: options.cancelText || 'Hủy bỏ',
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

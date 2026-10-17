export function backendUrl(path: string): string {
  const isServer = typeof window === 'undefined';
  const base =
    (isServer && process.env.INTERNAL_BACKEND_URL) ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://localhost:8080';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return new URL(cleanPath, base.endsWith('/') ? base : `${base}/`).toString();
}

export function jsonHeaders(extra?: HeadersInit): Record<string, string> {
  const headers = new Headers(extra);
  if (!headers.has('accept')) {
    headers.set('accept', 'application/json');
  }
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  return Object.fromEntries(headers.entries());
}

export async function backendFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = backendUrl(path);
  const method = init.method ?? 'GET';
  const start = Date.now();

  try {
    const res = await fetch(url, {
      ...init,
      headers: jsonHeaders(init.headers),
      cache: 'no-store',
    });
    const duration = Date.now() - start;
    console.log(`[BFF -> Backend] ${method} ${url} -> ${res.status} (${duration}ms)`);
    return res;
  } catch (err) {
    if (typeof window !== 'undefined' && url.startsWith('http') && !url.startsWith(window.location.origin)) {
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      const fallbackUrl = `/${cleanPath}`;
      try {
        console.warn(`[BFF Fetch Fallback] Retrying ${method} ${url} via same-origin ${fallbackUrl}`);
        const res = await fetch(fallbackUrl, {
          ...init,
          headers: jsonHeaders(init.headers),
          cache: 'no-store',
        });
        const duration = Date.now() - start;
        console.log(`[BFF -> Backend Fallback] ${method} ${fallbackUrl} -> ${res.status} (${duration}ms)`);
        return res;
      } catch (fallbackErr) {
        console.error(`[BFF Fallback Error] ${method} ${fallbackUrl} also failed:`, fallbackErr);
      }
    }
    const duration = Date.now() - start;
    console.error(`[BFF Fetch Error] ${method} ${url} failed after ${duration}ms:`, err);
    throw err;
  }
}

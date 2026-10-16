export function backendUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  return new URL(path, base.endsWith('/') ? base : `${base}/`).toString();
}

export function jsonHeaders(extra?: HeadersInit): Record<string, string> {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...Object.fromEntries(new Headers(extra).entries()),
  };
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
    const duration = Date.now() - start;
    console.error(`[BFF Fetch Error] ${method} ${url} failed after ${duration}ms:`, err);
    throw err;
  }
}

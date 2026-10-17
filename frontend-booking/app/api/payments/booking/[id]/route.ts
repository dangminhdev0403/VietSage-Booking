import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { backendFetch } from '@/lib/api/backend';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();
    const token =
      (session as unknown as { accessToken?: string })?.accessToken ||
      (session?.user as unknown as { accessToken?: string })?.accessToken;

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const contact = req.nextUrl.searchParams.get('contact');
    const query = contact ? `?contact=${encodeURIComponent(contact)}` : '';

    const res = await backendFetch(`api/v1/payments/booking/${id}${query}`, {
      method: 'GET',
      headers,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi lấy thông tin thanh toán';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PAYMENT_FETCH_ERROR',
          message,
        },
      },
      { status: 500 },
    );
  }
}

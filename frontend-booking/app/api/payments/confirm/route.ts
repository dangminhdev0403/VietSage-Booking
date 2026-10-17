import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { backendFetch } from '@/lib/api/backend';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const token =
      (session as unknown as { accessToken?: string })?.accessToken ||
      (session?.user as unknown as { accessToken?: string })?.accessToken;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Yêu cầu đăng nhập tài khoản quản trị để xác nhận thanh toán',
          },
        },
        { status: 401 },
      );
    }

    const body = await req.json();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const res = await backendFetch('api/v1/payments/confirm', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi xác nhận thanh toán';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PAYMENT_CONFIRM_ERROR',
          message,
        },
      },
      { status: 500 },
    );
  }
}

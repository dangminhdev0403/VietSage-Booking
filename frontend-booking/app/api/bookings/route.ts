import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { backendFetch } from '@/lib/api/backend';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const token =
      (session as unknown as { accessToken?: string })?.accessToken ||
      (session?.user as unknown as { accessToken?: string })?.accessToken;

    if (!session || !token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Vui lòng đăng nhập để truy cập danh sách đặt phòng',
          },
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';

    const res = await backendFetch(`api/v1/bookings${queryString}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ đặt phòng';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BOOKING_FETCH_ERROR',
          message,
        },
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const token =
      (session as unknown as { accessToken?: string })?.accessToken ||
      (session?.user as unknown as { accessToken?: string })?.accessToken;

    const body = await req.json();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await backendFetch('api/v1/bookings', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ đặt phòng';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BOOKING_CREATE_ERROR',
          message,
        },
      },
      { status: 500 },
    );
  }
}

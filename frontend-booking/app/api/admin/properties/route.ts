import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { backendFetch } from '@/lib/api/backend';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await backendFetch(`api/v1/properties${query}`, {
      method: 'GET',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi lấy danh sách khách sạn';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PROPERTY_FETCH_ERROR',
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
    const sessionError = (session as unknown as { error?: string })?.error;

    if (!session || !token || sessionError === 'RefreshAccessTokenError') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Vui lòng đăng nhập quyền quản trị để đăng cơ sở lưu trú mới',
          },
        },
        { status: 401 },
      );
    }

    const body = await req.json();

    const res = await backendFetch('api/v1/properties', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (res.status === 401) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Phiên đăng nhập quản trị đã hết hạn. Vui lòng đăng nhập lại.',
          },
        },
        { status: 401 },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi đăng cơ sở lưu trú mới';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PROPERTY_CREATE_ERROR',
          message,
        },
      },
      { status: 500 },
    );
  }
}

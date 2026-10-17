import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { backendFetch } from '@/lib/api/backend';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    let token =
      (session as unknown as { accessToken?: string })?.accessToken ||
      (session?.user as unknown as { accessToken?: string })?.accessToken;
    const sessionError = (session as unknown as { error?: string })?.error;

    if (!session || !token || sessionError === 'RefreshAccessTokenError') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Vui lòng đăng nhập quyền quản trị hoặc đối tác để xem lịch tồn kho',
          },
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('property_id');
    const month = searchParams.get('month');

    if (!propertyId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Thiếu tham số property_id',
          },
        },
        { status: 400 },
      );
    }

    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    let res = await backendFetch(`api/v1/properties/${propertyId}/allotments${query}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
    const message = err instanceof Error ? err.message : 'Lỗi lấy thông tin lịch tồn kho';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ALLOTMENT_FETCH_ERROR',
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
    let token =
      (session as unknown as { accessToken?: string })?.accessToken ||
      (session?.user as unknown as { accessToken?: string })?.accessToken;
    const sessionError = (session as unknown as { error?: string })?.error;

    if (!session || !token || sessionError === 'RefreshAccessTokenError') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Vui lòng đăng nhập quyền quản trị hoặc đối tác để cập nhật tồn kho',
          },
        },
        { status: 401 },
      );
    }

    const body = await req.json();

    let res = await backendFetch('api/v1/allotments/update', {
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
    const message = err instanceof Error ? err.message : 'Lỗi cập nhật tồn kho';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ALLOTMENT_UPDATE_ERROR',
          message,
        },
      },
      { status: 500 },
    );
  }
}

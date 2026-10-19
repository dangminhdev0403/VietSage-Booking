import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { backendFetch } from '@/lib/api/backend';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
            message: 'Vui lòng đăng nhập quyền quản trị hoặc đối tác để cập nhật thông tin khách sạn',
          },
        },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await req.json();

    const res = await backendFetch(`api/v1/properties/${id}`, {
      method: 'PUT',
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
    const message = err instanceof Error ? err.message : 'Lỗi cập nhật thông tin cơ sở lưu trú';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PROPERTY_UPDATE_ERROR',
          message,
        },
      },
      { status: 500 },
    );
  }
}

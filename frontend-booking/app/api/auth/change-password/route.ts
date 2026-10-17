import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { backendFetch } from '@/lib/api/backend';

export async function PUT(req: NextRequest) {
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
            message: 'Vui lòng đăng nhập để đổi mật khẩu',
          },
        },
        { status: 401 },
      );
    }

    const body = await req.json();

    const res = await backendFetch('api/v1/auth/change-password', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi đổi mật khẩu';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CHANGE_PASSWORD_ERROR',
          message,
        },
      },
      { status: 500 },
    );
  }
}

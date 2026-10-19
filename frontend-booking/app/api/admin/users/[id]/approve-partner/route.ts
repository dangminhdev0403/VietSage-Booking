import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { backendFetch } from '@/lib/api/backend';

export async function POST(
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
            message: 'Vui lòng đăng nhập với quyền quản trị viên',
          },
        },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const res = await backendFetch(`api/v1/admin/users/${id}/approve-partner`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Lỗi phê duyệt đối tác khách sạn';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'APPROVE_PARTNER_ERROR',
          message,
        },
      },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { backendFetch } from '@/lib/api/backend';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
            message: 'Vui lòng đăng nhập để cập nhật trạng thái đặt phòng',
          },
        },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await req.json();

    const res = await backendFetch(`api/v1/bookings/${id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
          code: 'BOOKING_STATUS_UPDATE_ERROR',
          message,
        },
      },
      { status: 500 },
    );
  }
}

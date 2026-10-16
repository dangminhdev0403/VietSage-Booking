import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/backend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await backendFetch('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ đăng ký';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'REGISTRATION_ERROR',
          message,
        },
      },
      { status: 500 },
    );
  }
}

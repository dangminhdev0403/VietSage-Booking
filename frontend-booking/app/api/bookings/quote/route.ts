import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/backend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await backendFetch('api/v1/bookings/quote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ tính giá phòng';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BOOKING_QUOTE_ERROR',
          message,
        },
      },
      { status: 500 },
    );
  }
}

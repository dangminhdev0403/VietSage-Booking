import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/backend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const idempotencyKey = req.headers.get('idempotency-key') || req.headers.get('x-idempotency-key');
    const lookupToken = req.headers.get('x-lookup-token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (idempotencyKey) {
      headers['idempotency-key'] = idempotencyKey;
    }
    if (lookupToken) {
      headers['x-lookup-token'] = lookupToken;
    }

    const res = await backendFetch('api/v1/payments/checkout', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi khởi tạo cổng thanh toán';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CHECKOUT_CREATE_ERROR',
          message,
        },
      },
      { status: 500 },
    );
  }
}

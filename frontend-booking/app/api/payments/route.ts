import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { backendFetch } from '@/lib/api/backend';

interface RawBookingWithPayments {
  id: string;
  booking_code?: string;
  property_id?: string;
  property_name?: string;
  guest_name?: string;
  payments?: Array<{
    id: string;
    amount: number;
    payment_method: string;
    status: string;
    transaction_ref?: string | null;
    paid_at?: string | null;
    created_at?: string;
  }>;
}

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
            message: 'Vui lòng đăng nhập để truy cập lịch sử thanh toán',
          },
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const q = new URLSearchParams();
    if (searchParams.get('property_id')) q.set('property_id', searchParams.get('property_id')!);
    if (searchParams.get('status')) q.set('status', searchParams.get('status')!);
    if (searchParams.get('page')) q.set('page', searchParams.get('page')!);
    if (searchParams.get('page_size')) q.set('page_size', searchParams.get('page_size')!);

    const queryString = q.toString() ? `?${q.toString()}` : '';

    const res = await backendFetch(`api/v1/payments${queryString}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    // Fallback if backend /api/v1/payments endpoint returns 404
    if (res.status === 404) {
      const bookingsRes = await backendFetch(`api/v1/bookings?page_size=100`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (bookingsRes.ok) {
        const bookingsEnvelope = await bookingsRes.json();
        const bookings: RawBookingWithPayments[] = bookingsEnvelope?.data?.items || [];

        const propertyIdFilter = searchParams.get('property_id');
        const statusFilter = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('page_size') || '10', 10);

        let allPayments = bookings.flatMap((b) =>
          (b.payments || []).map((p) => ({
            id: p.id,
            booking_id: b.id,
            booking_code: b.booking_code,
            property_id: b.property_id,
            property_name: b.property_name,
            guest_name: b.guest_name,
            amount: p.amount,
            currency: 'VND',
            payment_method: p.payment_method,
            status: p.status,
            transaction_ref: p.transaction_ref ?? null,
            paid_at: p.paid_at ?? null,
            created_at: p.created_at || new Date().toISOString(),
          })),
        );

        if (propertyIdFilter) {
          allPayments = allPayments.filter((p) => p.property_id === propertyIdFilter);
        }
        if (statusFilter && statusFilter !== 'ALL') {
          allPayments = allPayments.filter((p) => p.status === statusFilter);
        }

        const total = allPayments.length;
        const start = (page - 1) * pageSize;
        const paginatedItems = allPayments.slice(start, start + pageSize);

        return NextResponse.json({
          success: true,
          data: {
            items: paginatedItems,
            page,
            page_size: pageSize,
            total,
            has_next: start + pageSize < total,
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          items: [],
          page: 1,
          page_size: 10,
          total: 0,
          has_next: false,
        },
      });
    }

    const errorData = await res.json().catch(() => ({}));
    return NextResponse.json(errorData, { status: res.status });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Lỗi kết nối máy chủ quản lý thanh toán';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PAYMENTS_FETCH_ERROR',
          message,
        },
      },
      { status: 500 },
    );
  }
}

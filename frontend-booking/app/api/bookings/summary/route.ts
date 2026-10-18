import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { backendFetch } from '@/lib/api/backend';

interface BookingItemRaw {
  id: string;
  total_price?: number;
  status?: string;
  payment_status?: string;
  check_in?: string;
  property_id?: string;
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
            message: 'Vui lòng đăng nhập để truy cập số liệu tổng quan',
          },
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const q = new URLSearchParams();
    if (searchParams.get('property_id')) q.set('property_id', searchParams.get('property_id')!);
    if (searchParams.get('from')) q.set('from', searchParams.get('from')!);
    if (searchParams.get('to')) q.set('to', searchParams.get('to')!);

    const queryString = q.toString() ? `?${q.toString()}` : '';

    const res = await backendFetch(`api/v1/bookings/summary${queryString}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    // Graceful fallback if backend endpoint returns 404
    if (res.status === 404) {
      const bookingsRes = await backendFetch(`api/v1/bookings?page_size=100`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (bookingsRes.ok) {
        const bookingsEnvelope = await bookingsRes.json();
        const items: BookingItemRaw[] = bookingsEnvelope?.data?.items || [];
        const now = new Date();
        const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const propertyIdFilter = searchParams.get('property_id');
        const filtered = propertyIdFilter
          ? items.filter((b) => b.property_id === propertyIdFilter)
          : items;

        const grossBookingValue = filtered
          .filter((b) => b.status !== 'CANCELLED')
          .reduce((sum, b) => sum + (b.total_price || 0), 0);

        const totalBookings = filtered.length;
        const confirmedBookings = filtered.filter(
          (b) => b.status === 'CONFIRMED' || b.payment_status === 'PAID',
        ).length;
        const pendingBookings = filtered.filter(
          (b) => b.status === 'PENDING' && b.payment_status !== 'PAID',
        ).length;
        const cancelledBookings = filtered.filter((b) => b.status === 'CANCELLED').length;

        const upcomingCheckins7d = filtered.filter((b) => {
          if (!b.check_in) return false;
          const ci = new Date(b.check_in);
          return ci >= now && ci <= sevenDaysLater && b.status !== 'CANCELLED';
        }).length;

        return NextResponse.json({
          success: true,
          data: {
            gross_booking_value: grossBookingValue,
            total_bookings: totalBookings,
            confirmed_bookings: confirmedBookings,
            pending_bookings: pendingBookings,
            cancelled_bookings: cancelledBookings,
            upcoming_checkins_7d: upcomingCheckins7d,
          },
        });
      }
    }

    const errorData = await res.json().catch(() => ({}));
    return NextResponse.json(errorData, { status: res.status });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Lỗi kết nối máy chủ tổng quan đặt phòng';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BOOKING_SUMMARY_ERROR',
          message,
        },
      },
      { status: 500 },
    );
  }
}

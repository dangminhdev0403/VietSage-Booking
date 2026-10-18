import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { backendFetch } from '@/lib/api/backend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const bookingCode = body.booking_code;

    if (!bookingCode) {
      return NextResponse.json(
        { success: false, error: { message: 'Thiếu mã đơn đặt phòng' } },
        { status: 400 },
      );
    }

    const eventId = `evt_sim_${crypto.randomBytes(12).toString('hex')}`;
    const webhookSecret =
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_localmate_secret';
    const timestamp = Math.floor(Date.now() / 1000);

    const payload = JSON.stringify({
      id: eventId,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: `cs_test_${crypto.randomBytes(12).toString('hex')}`,
          client_reference_id: bookingCode,
          payment_status: 'paid',
          amount_total: body.amount || 8700000,
          currency: 'vnd',
          metadata: {
            bookingCode,
          },
        },
      },
    });

    const signedPayload = `${timestamp}.${payload}`;
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    const signatureHeader = `t=${timestamp},v1=${signature}`;

    const res = await backendFetch('api/v1/payments/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'stripe-signature': signatureHeader,
      },
      body: payload,
    });

    const data = await res.json();
    return NextResponse.json({
      success: true,
      data,
      message: 'Mô phỏng thanh toán thành công!',
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Lỗi khi mô phỏng webhook';
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 },
    );
  }
}

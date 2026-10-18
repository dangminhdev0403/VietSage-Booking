import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  DEFAULT_PAYMENT_CURRENCY,
  STRIPE_CHECKOUT_EXPIRY_SECONDS,
  getCheckoutSessionIdempotencyKey,
} from './stripe-localmate.constants';

export interface CreateCheckoutSessionParams {
  paymentId: string;
  bookingCode: string;
  lookupToken?: string;
  amount: number;
  currency?: string;
  checkoutAttemptId?: string;
  returnBaseUrl?: string;
  expiresAtUnixSeconds?: number;
}

export interface StripeCheckoutSessionResponse {
  id: string;
  url: string | null;
  expires_at: number;
  payment_status: string;
  status: string;
  payment_intent?: string | null;
  amount_total: number;
  currency: string;
  client_reference_id: string;
}

@Injectable()
export class StripeLocalMateClient {
  private readonly logger = new Logger(StripeLocalMateClient.name);
  private readonly simulatedSessions = new Map<
    string,
    StripeCheckoutSessionResponse
  >();

  private isSimulated(): boolean {
    const key = process.env.STRIPE_SECRET_KEY;
    return (
      !key ||
      key.startsWith('sk_test_simulated') ||
      process.env.STRIPE_SIMULATED === 'true'
    );
  }

  async createCheckoutSession(
    params: CreateCheckoutSessionParams,
  ): Promise<StripeCheckoutSessionResponse> {
    const currency = (
      params.currency || DEFAULT_PAYMENT_CURRENCY
    ).toLowerCase();
    const nowSeconds = Math.floor(Date.now() / 1000);
    const expiresAt =
      params.expiresAtUnixSeconds ??
      nowSeconds + STRIPE_CHECKOUT_EXPIRY_SECONDS;

    if (this.isSimulated()) {
      const sessionId = `cs_test_${crypto.randomBytes(12).toString('hex')}`;
      const sessionUrl = `https://checkout.stripe.com/c/pay/${sessionId}#test_booking_${params.bookingCode}`;
      const session: StripeCheckoutSessionResponse = {
        id: sessionId,
        url: sessionUrl,
        expires_at: expiresAt,
        payment_status: 'unpaid',
        status: 'open',
        payment_intent: `pi_test_${crypto.randomBytes(12).toString('hex')}`,
        amount_total: params.amount,
        currency,
        client_reference_id: params.bookingCode,
      };
      this.simulatedSessions.set(sessionId, session);
      return session;
    }

    const secretKey = process.env.STRIPE_SECRET_KEY!;
    const returnBaseUrl =
      params.returnBaseUrl ||
      process.env.STRIPE_CHECKOUT_RETURN_BASE_URL ||
      'http://localhost:3000';
    const idempotencyKey = getCheckoutSessionIdempotencyKey(
      params.paymentId,
      params.checkoutAttemptId,
    );

    const body = new URLSearchParams();
    body.append('mode', 'payment');
    body.append('currency', currency);
    body.append('line_items[0][price_data][currency]', currency);
    body.append(
      'line_items[0][price_data][unit_amount]',
      String(Math.round(params.amount)),
    );
    body.append(
      'line_items[0][price_data][product_data][name]',
      `Đặt cọc 30% phòng - ${params.bookingCode}`,
    );
    body.append('line_items[0][quantity]', '1');
    body.append('client_reference_id', params.bookingCode);
    body.append('metadata[bookingCode]', params.bookingCode);
    body.append('metadata[paymentId]', params.paymentId);
    body.append('expires_at', String(expiresAt));
    const lookupTokenParam = params.lookupToken
      ? `&token=${encodeURIComponent(params.lookupToken)}`
      : '';
    body.append(
      'success_url',
      `${returnBaseUrl}/booking/success?booking_code=${encodeURIComponent(params.bookingCode)}${lookupTokenParam}&session_id={CHECKOUT_SESSION_ID}`,
    );
    body.append(
      'cancel_url',
      `${returnBaseUrl}/booking/cancel?booking_code=${encodeURIComponent(params.bookingCode)}`,
    );

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Idempotency-Key': idempotencyKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as unknown;
      this.logger.error(
        `Stripe checkout creation failed: ${JSON.stringify(err)}`,
      );
      throw new Error(`Stripe checkout creation failed: ${res.statusText}`);
    }

    const data = (await res.json()) as StripeCheckoutSessionResponse;
    return {
      id: data.id,
      url: data.url,
      expires_at: data.expires_at,
      payment_status: data.payment_status,
      status: data.status,
      payment_intent: data.payment_intent,
      amount_total: data.amount_total,
      currency: data.currency,
      client_reference_id: data.client_reference_id,
    };
  }

  async getCheckoutSession(
    sessionId: string,
  ): Promise<StripeCheckoutSessionResponse | null> {
    if (this.isSimulated()) {
      return this.simulatedSessions.get(sessionId) ?? null;
    }
    const secretKey = process.env.STRIPE_SECRET_KEY!;
    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      {
        headers: { Authorization: `Bearer ${secretKey}` },
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as StripeCheckoutSessionResponse;
    return {
      id: data.id,
      url: data.url,
      expires_at: data.expires_at,
      payment_status: data.payment_status,
      status: data.status,
      payment_intent: data.payment_intent,
      amount_total: data.amount_total,
      currency: data.currency,
      client_reference_id: data.client_reference_id,
    };
  }
}

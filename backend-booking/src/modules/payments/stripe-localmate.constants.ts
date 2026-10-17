export const STRIPE_SIGNATURE_HEADER = 'stripe-signature';
export const STRIPE_WEBHOOK_TOLERANCE_SECONDS = 300;
export const STRIPE_CHECKOUT_EXPIRY_SECONDS = 1800; // 30 minutes
export const DEFAULT_PAYMENT_CURRENCY = 'VND';

export const getCheckoutSessionIdempotencyKey = (
  paymentId: string,
  checkoutAttemptId?: string,
): string =>
  checkoutAttemptId
    ? `localmate:${paymentId}:checkout:${checkoutAttemptId}`
    : `localmate:${paymentId}:checkout:v1`;

export const getRefundIdempotencyKey = (
  paymentId: string,
  refundedAmountVnd?: number | string,
): string =>
  refundedAmountVnd === undefined
    ? `localmate:${paymentId}:refund:v1`
    : `localmate:${paymentId}:refund:${refundedAmountVnd}`;

export const HANDLED_STRIPE_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired',
  'charge.refunded',
] as const;

export type HandledStripeWebhookEvent =
  (typeof HANDLED_STRIPE_WEBHOOK_EVENTS)[number];

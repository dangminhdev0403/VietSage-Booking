import { BadRequestException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { StripeSignatureVerifier } from './stripe-signature.verifier';

describe('StripeSignatureVerifier', () => {
  let verifier: StripeSignatureVerifier;
  const secret = 'whsec_test_secret_for_unit_tests_123456';

  beforeEach(() => {
    verifier = new StripeSignatureVerifier();
  });

  const generateSignatureHeader = (
    timestamp: number,
    payload: string,
    key = secret,
  ): string => {
    const signedPayload = `${timestamp}.${payload}`;
    const signature = createHmac('sha256', key)
      .update(signedPayload, 'utf8')
      .digest('hex');
    return `t=${timestamp},v1=${signature}`;
  };

  it('should verify a valid signature within tolerance', () => {
    const now = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify({
      id: 'evt_test_1',
      type: 'checkout.session.completed',
    });
    const header = generateSignatureHeader(now, payload);

    const result = verifier.verify({
      rawBody: Buffer.from(payload, 'utf8'),
      signatureHeader: header,
      secret,
      currentTimestamp: now,
    });

    expect(result.verified).toBe(true);
    expect(result.timestamp).toBe(now);
  });

  it('should verify with string rawBody as well', () => {
    const now = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify({ id: 'evt_test_2' });
    const header = generateSignatureHeader(now, payload);

    const result = verifier.verify({
      rawBody: payload,
      signatureHeader: header,
      secret,
      currentTimestamp: now,
    });

    expect(result.verified).toBe(true);
  });

  it('should support multiple v1 signatures in header', () => {
    const now = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify({ id: 'evt_test_3' });
    const signedPayload = `${now}.${payload}`;
    const validSig = createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('hex');
    const header = `t=${now},v1=invalidsig1234,v1=${validSig}`;

    const result = verifier.verify({
      rawBody: Buffer.from(payload, 'utf8'),
      signatureHeader: header,
      secret,
      currentTimestamp: now,
    });

    expect(result.verified).toBe(true);
  });

  it('should reject timestamp drift exceeding 300 seconds', () => {
    const now = Math.floor(Date.now() / 1000);
    const expiredTimestamp = now - 301;
    const payload = JSON.stringify({ id: 'evt_test_expired' });
    const header = generateSignatureHeader(expiredTimestamp, payload);

    expect(() =>
      verifier.verify({
        rawBody: payload,
        signatureHeader: header,
        secret,
        currentTimestamp: now,
        toleranceSeconds: 300,
      }),
    ).toThrow(BadRequestException);
  });

  it('should reject when secret is missing', () => {
    expect(() =>
      verifier.verify({
        rawBody: 'test',
        signatureHeader: 't=123,v1=abc',
        secret: '',
      }),
    ).toThrow(BadRequestException);
  });

  it('should reject when signature header is missing or empty', () => {
    expect(() =>
      verifier.verify({
        rawBody: 'test',
        signatureHeader: '',
        secret,
      }),
    ).toThrow(BadRequestException);
  });

  it('should reject when rawBody is empty', () => {
    expect(() =>
      verifier.verify({
        rawBody: '',
        signatureHeader: 't=123,v1=abc',
        secret,
      }),
    ).toThrow(BadRequestException);
  });

  it('should reject when signature is computed with wrong secret', () => {
    const now = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify({ id: 'evt_wrong' });
    const header = generateSignatureHeader(now, payload, 'wrong_secret_123456');

    expect(() =>
      verifier.verify({
        rawBody: payload,
        signatureHeader: header,
        secret,
        currentTimestamp: now,
      }),
    ).toThrow(BadRequestException);
  });
});

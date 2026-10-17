import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: any;

  beforeEach(async () => {
    service = {
      createDepositCheckout: jest.fn(),
      handleWebhook: jest.fn(),
      createPaymentIntent: jest.fn(),
      confirmPayment: jest.fn(),
      getPaymentByBookingId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: PaymentsService, useValue: service }],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  describe('createDepositCheckout', () => {
    it('should call paymentsService.createDepositCheckout with validated parameters', async () => {
      service.createDepositCheckout.mockResolvedValue({
        booking_code: 'OTA-1234',
        amount: 1350000,
        session_id: 'cs_test_123',
      });

      const body = {
        booking_code: 'OTA-1234',
        lookup_token: 'token-abc',
      };

      const result = await controller.createDepositCheckout(
        body,
        'idemp-key-1',
        undefined,
      );

      expect(result.success).toBe(true);
      expect(result.data.booking_code).toBe('OTA-1234');
      expect(service.createDepositCheckout).toHaveBeenCalledWith(
        'OTA-1234',
        'token-abc',
        'idemp-key-1',
      );
    });

    it('should extract lookup token from header if not in body', async () => {
      service.createDepositCheckout.mockResolvedValue({
        booking_code: 'OTA-1234',
        amount: 1350000,
      });

      const body = {
        booking_code: 'OTA-1234',
      };

      await controller.createDepositCheckout(
        body,
        undefined,
        'token-from-header',
      );

      expect(service.createDepositCheckout).toHaveBeenCalledWith(
        'OTA-1234',
        'token-from-header',
        undefined,
      );
    });
  });

  describe('handleWebhook', () => {
    it('should forward raw body and signature header to paymentsService.handleWebhook', async () => {
      service.handleWebhook.mockResolvedValue({
        received: true,
        status: 'PROCESSED',
      });

      const rawBuffer = Buffer.from(
        JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed' }),
        'utf8',
      );
      const req = { rawBody: rawBuffer } as unknown as Request & {
        rawBody?: Buffer;
      };
      const signatureHeader = 't=123,v1=sig';

      const result = await controller.handleWebhook(
        signatureHeader,
        req,
        undefined,
      );

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('PROCESSED');
      expect(service.handleWebhook).toHaveBeenCalledWith(
        rawBuffer,
        signatureHeader,
      );
    });

    it('should fallback to request body if rawBody is not present on req', async () => {
      service.handleWebhook.mockResolvedValue({
        received: true,
        status: 'PROCESSED',
      });

      const bodyObj = { id: 'evt_2', type: 'charge.refunded' };
      const req = {} as unknown as Request & { rawBody?: Buffer };
      const signatureHeader = 't=123,v1=sig';

      const result = await controller.handleWebhook(
        signatureHeader,
        req,
        bodyObj,
      );

      expect(result.success).toBe(true);
      expect(service.handleWebhook).toHaveBeenCalledWith(
        JSON.stringify(bodyObj),
        signatureHeader,
      );
    });
  });
});

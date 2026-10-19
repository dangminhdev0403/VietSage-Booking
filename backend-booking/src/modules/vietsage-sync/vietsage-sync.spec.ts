import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  GatewayTimeoutException,
  NotImplementedException,
} from '@nestjs/common';
import { SyncStatus } from '@prisma/client';
import { VietSageSyncController } from './vietsage-sync.controller';
import {
  VietSageSyncService,
  computeCanonicalPayload,
  signHmacPayload,
  verifyHmacSignature,
} from './vietsage-sync.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('VietSageSyncModule', () => {
  let controller: VietSageSyncController;
  let service: VietSageSyncService;
  let prismaMock: {
    vietSageSyncLog: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      upsert: jest.Mock;
    };
    roomAllotment: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
    };
    roomType: {
      findFirst: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      vietSageSyncLog: {
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn(),
        upsert: jest.fn(),
      },
      roomAllotment: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
      },
      roomType: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VietSageSyncController],
      providers: [
        VietSageSyncService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    controller = module.get<VietSageSyncController>(VietSageSyncController);
    service = module.get<VietSageSyncService>(VietSageSyncService);
  });

  describe('VietSageSyncController', () => {
    it('rejects unsupported sync_type at the trust boundary with BadRequestException', async () => {
      await expect(
        controller.sync({ sync_type: 'invalid_type_xyz' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('fails closed with NotImplementedException (501) for valid sync_type', async () => {
      await expect(controller.sync({ sync_type: 'all' })).rejects.toThrow(
        NotImplementedException,
      );
    });
  });

  describe('VietSageSyncService - Legacy Fail-Closed behavior', () => {
    it('throws NotImplementedException without writing fake SUCCESS or fake ID', async () => {
      await expect(service.syncFromVietSage('inventory')).rejects.toThrow(
        NotImplementedException,
      );
    });

    it('pushBookingToVietSage rejects fake reservation ID emission with NotImplementedException', async () => {
      await expect(
        service.pushBookingToVietSage('booking-id-123'),
      ).rejects.toThrow(NotImplementedException);
    });
  });

  describe('HMAC Request Signing and Verification', () => {
    const testSecret = 'test_secret_key_32_chars_minimum_length!';
    const method = 'POST';
    const path = '/channel-manager/direct-booking/holds';
    const timestamp = Math.floor(Date.now() / 1000);
    const requestId = 'req-uuid-1234';
    const body = { hotel_id: 'hotel-1', room_type_id: 'deluxe' };

    it('computes deterministic canonical payload and signs correctly', () => {
      const canonical = computeCanonicalPayload(
        method,
        path,
        timestamp,
        requestId,
        body,
      );
      expect(canonical).toContain('POST\n');
      expect(canonical).toContain(path);
      expect(canonical).toContain(String(timestamp));
      expect(canonical).toContain(requestId);

      const sig1 = signHmacPayload(canonical, testSecret);
      const sig2 = signHmacPayload(canonical, testSecret);
      expect(sig1).toHaveLength(64);
      expect(sig1).toEqual(sig2);
    });

    it('verifyHmacSignature succeeds for valid signature with timestamp tolerance', () => {
      const canonical = computeCanonicalPayload(
        method,
        path,
        timestamp,
        requestId,
        body,
      );
      const signature = signHmacPayload(canonical, testSecret);

      const result = verifyHmacSignature({
        method,
        path,
        timestamp,
        requestId,
        body,
        signatureHeader: `t=${timestamp},v1=${signature}`,
        secret: testSecret,
        toleranceSeconds: 300,
        currentTimestamp: timestamp + 60,
      });

      expect(result.verified).toBe(true);
      expect(result.timestamp).toBe(timestamp);
    });

    it('rejects stale timestamp exceeding tolerance window', () => {
      const canonical = computeCanonicalPayload(
        method,
        path,
        timestamp,
        requestId,
        body,
      );
      const signature = signHmacPayload(canonical, testSecret);

      expect(() =>
        verifyHmacSignature({
          method,
          path,
          timestamp,
          requestId,
          body,
          signatureHeader: `t=${timestamp},v1=${signature}`,
          secret: testSecret,
          toleranceSeconds: 300,
          currentTimestamp: timestamp + 301,
        }),
      ).toThrow(BadRequestException);
    });

    it('rejects tampered body or invalid signature', () => {
      const canonical = computeCanonicalPayload(
        method,
        path,
        timestamp,
        requestId,
        body,
      );
      const signature = signHmacPayload(canonical, testSecret);

      expect(() =>
        verifyHmacSignature({
          method,
          path,
          timestamp,
          requestId,
          body: { ...body, tampered: true },
          signatureHeader: `t=${timestamp},v1=${signature}`,
          secret: testSecret,
        }),
      ).toThrow(BadRequestException);
    });

    it('rejects when secret is missing or empty', () => {
      expect(() =>
        verifyHmacSignature({
          method,
          path,
          timestamp,
          requestId,
          body,
          signatureHeader: 'sig-abc',
          secret: '',
        }),
      ).toThrow(BadRequestException);
    });
  });

  describe('createHold', () => {
    it('validates date interval (check_out > check_in)', async () => {
      await expect(
        service.createHold({
          hotelId: 'h1',
          roomTypeId: 'r1',
          checkInDate: '2026-11-10',
          checkOutDate: '2026-11-10',
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.createHold({
          hotelId: 'h1',
          roomTypeId: 'r1',
          checkInDate: '2026-11-12',
          checkOutDate: '2026-11-10',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates hold with signed request and idempotency key', async () => {
      let dispatchedHeaders: Record<string, string> = {};
      service.setHttpClient((_url, init) => {
        dispatchedHeaders = init?.headers as Record<string, string>;
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () =>
            Promise.resolve({
              data: {
                hold_id: 'vs-hold-999',
                expires_at: '2026-11-10T12:15:00.000Z',
              },
            }),
        } as unknown as Response);
      });

      prismaMock.vietSageSyncLog.findUnique.mockResolvedValue(null);
      prismaMock.vietSageSyncLog.upsert.mockResolvedValue({});

      const result = await service.createHold({
        hotelId: 'hotel-01',
        roomTypeId: 'room-type-deluxe',
        checkInDate: '2026-11-10',
        checkOutDate: '2026-11-15',
        roomsCount: 1,
        guestName: 'Nguyễn Văn A',
        guestEmail: 'vana@example.com',
        idempotencyKey: 'idemp-hold-001',
      });

      expect(result.holdId).toBe('vs-hold-999');
      expect(result.status).toBe('HELD');
      expect(dispatchedHeaders['Idempotency-Key']).toBe('idemp-hold-001');
      expect(dispatchedHeaders['X-Signature']).toContain('v1=');
      expect(dispatchedHeaders['X-Timestamp']).toBeDefined();
    });

    it('returns cached hold result on idempotent replay', async () => {
      const cachedHold = {
        holdId: 'vs-hold-cached',
        status: 'HELD',
        hotelId: 'hotel-01',
        roomTypeId: 'room-01',
        checkInDate: '2026-11-10',
        checkOutDate: '2026-11-15',
        roomsCount: 1,
        expiresAt: '2026-11-10T12:15:00.000Z',
      };

      prismaMock.vietSageSyncLog.findUnique.mockResolvedValue({
        status: SyncStatus.SUCCESS,
        response: cachedHold,
      });

      const httpMock = jest.fn();
      service.setHttpClient(httpMock);

      const result = await service.createHold({
        hotelId: 'hotel-01',
        roomTypeId: 'room-01',
        checkInDate: '2026-11-10',
        checkOutDate: '2026-11-15',
        idempotencyKey: 'idemp-repeat',
      });

      expect(result.holdId).toBe('vs-hold-cached');
      expect(httpMock).not.toHaveBeenCalled();
    });

    it('rejects with ConflictException when inventory is not available (409)', async () => {
      service.setHttpClient(() => {
        return Promise.resolve({
          ok: false,
          status: 409,
          text: () => Promise.resolve('Room sold out on selected dates'),
        } as unknown as Response);
      });

      prismaMock.vietSageSyncLog.findUnique.mockResolvedValue(null);
      prismaMock.vietSageSyncLog.upsert.mockResolvedValue({});

      await expect(
        service.createHold({
          hotelId: 'h1',
          roomTypeId: 'r1',
          checkInDate: '2026-11-10',
          checkOutDate: '2026-11-15',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('confirmHold and Invariant Enforcement', () => {
    it('confirms hold, sets status CONFIRMED, and guarantees room status is NEVER OCCUPIED before check-in', async () => {
      service.setHttpClient(() => {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              data: {
                reservation_id: 'pms-res-777',
                reservation_code: 'VS-OTA-RES-777',
                room_status: 'RESERVED',
                confirmed_at: '2026-11-10T08:00:00.000Z',
              },
            }),
        } as unknown as Response);
      });

      prismaMock.vietSageSyncLog.findUnique.mockResolvedValue(null);
      prismaMock.vietSageSyncLog.upsert.mockResolvedValue({});
      prismaMock.vietSageSyncLog.update.mockResolvedValue({});

      const result = await service.confirmHold(
        'vs-hold-999',
        'ota-booking-123',
        'idemp-confirm-123',
      );

      expect(result.status).toBe('CONFIRMED');
      expect(result.reservationId).toBe('pms-res-777');
      expect(result.roomStatus).toBe('RESERVED');
      expect(result.roomStatus).not.toBe('OCCUPIED');
    });

    it('extracts assigned room info (roomNumber, floor) from VietSage confirmation response', async () => {
      service.setHttpClient(() => {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              data: {
                reservation_id: 'pms-res-888',
                reservation_code: 'VS-OTA-RES-888',
                room_status: 'RESERVED',
                assigned_room: {
                  room_number: '502',
                  floor: 5,
                },
                confirmed_at: '2026-11-10T08:00:00.000Z',
              },
            }),
        } as unknown as Response);
      });

      prismaMock.vietSageSyncLog.findUnique.mockResolvedValue(null);
      prismaMock.vietSageSyncLog.upsert.mockResolvedValue({});
      prismaMock.vietSageSyncLog.update.mockResolvedValue({});

      const result = await service.confirmHold(
        'vs-hold-502',
        'ota-booking-502',
      );

      expect(result.status).toBe('CONFIRMED');
      expect(result.assignedRoom).toBeDefined();
      expect(result.assignedRoom?.roomNumber).toBe('502');
      expect(result.assignedRoom?.floor).toBe(5);
    });

    it('enforces INVARIANT: throws ConflictException if VietSage mistakenly sets room status to OCCUPIED prior to check-in', async () => {
      service.setHttpClient(() => {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              data: {
                reservation_id: 'pms-res-invalid',
                room_status: 'OCCUPIED',
              },
            }),
        } as unknown as Response);
      });

      prismaMock.vietSageSyncLog.findUnique.mockResolvedValue(null);
      prismaMock.vietSageSyncLog.upsert.mockResolvedValue({});
      prismaMock.vietSageSyncLog.update.mockResolvedValue({});

      await expect(
        service.confirmHold('vs-hold-999', 'ota-booking-123'),
      ).rejects.toThrow(ConflictException);
    });

    it('idempotent replay returns cached confirmed reservation without calling network', async () => {
      const cachedConfirmed = {
        reservationId: 'pms-res-cached',
        reservationCode: 'VS-CACHED-01',
        holdId: 'vs-hold-999',
        bookingId: 'ota-booking-123',
        status: 'CONFIRMED',
        roomStatus: 'RESERVED',
        confirmedAt: '2026-11-10T08:00:00.000Z',
      };

      prismaMock.vietSageSyncLog.findUnique.mockResolvedValue({
        status: SyncStatus.SUCCESS,
        response: cachedConfirmed,
      });

      const httpMock = jest.fn();
      service.setHttpClient(httpMock);

      const result = await service.confirmHold(
        'vs-hold-999',
        'ota-booking-123',
      );
      expect(result.reservationId).toBe('pms-res-cached');
      expect(httpMock).not.toHaveBeenCalled();
    });

    it('handles timeout-after-write with durable operation key and automatic reconciliation recovery', async () => {
      let callCount = 0;
      service.setHttpClient((url) => {
        callCount++;
        if (url.includes('/confirm')) {
          return Promise.reject(
            new Error('ETIMEDOUT: Connection timed out after write'),
          );
        }
        if (url.includes('/status')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                data: {
                  confirmed: true,
                  reservation_id: 'pms-res-recovered-999',
                  reservation_code: 'VS-RECON-999',
                  room_status: 'RESERVED',
                },
              }),
          } as unknown as Response);
        }
        return Promise.reject(new Error(`Unhandled url: ${url}`));
      });

      prismaMock.vietSageSyncLog.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          status: SyncStatus.PENDING,
          syncType: 'direct_booking_confirm_hold',
          bookingId: 'ota-booking-123',
          payload: { holdId: 'vs-hold-999', bookingId: 'ota-booking-123' },
        });

      prismaMock.vietSageSyncLog.upsert.mockResolvedValue({});
      prismaMock.vietSageSyncLog.update.mockResolvedValue({});

      const result = await service.confirmHold(
        'vs-hold-999',
        'ota-booking-123',
      );
      expect(result.reservationId).toBe('pms-res-recovered-999');
      expect(result.status).toBe('CONFIRMED');
      expect(callCount).toBe(2);
    });

    it('throws GatewayTimeoutException if confirm times out and reconciliation is still pending', async () => {
      service.setHttpClient((url) => {
        if (url.includes('/confirm')) {
          return Promise.reject(new Error('ETIMEDOUT: network drop'));
        }
        if (url.includes('/status')) {
          return Promise.reject(
            new Error('ETIMEDOUT: status check network drop'),
          );
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      prismaMock.vietSageSyncLog.findUnique.mockResolvedValue({
        status: SyncStatus.PENDING,
        syncType: 'direct_booking_confirm_hold',
        bookingId: 'ota-booking-123',
      });
      prismaMock.vietSageSyncLog.upsert.mockResolvedValue({});
      prismaMock.vietSageSyncLog.update.mockResolvedValue({});

      await expect(
        service.confirmHold('vs-hold-999', 'ota-booking-123'),
      ).rejects.toThrow(GatewayTimeoutException);
    });
  });

  describe('releaseHold', () => {
    it('releases hold idempotently', async () => {
      service.setHttpClient(() => {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        } as unknown as Response);
      });

      prismaMock.vietSageSyncLog.findUnique.mockResolvedValue(null);
      prismaMock.vietSageSyncLog.upsert.mockResolvedValue({});

      const result = await service.releaseHold(
        'vs-hold-999',
        'GUEST_CANCELLED',
      );
      expect(result.holdId).toBe('vs-hold-999');
      expect(result.status).toBe('RELEASED');
    });
  });

  describe('reconcileOperation', () => {
    it('returns NOT_FOUND if operation key does not exist', async () => {
      prismaMock.vietSageSyncLog.findUnique.mockResolvedValue(null);
      const res = await service.reconcileOperation('unknown-key');
      expect(res.reconciled).toBe(false);
      expect(res.status).toBe('NOT_FOUND');
    });

    it('reconciles FAILED when VietSage reports hold was RELEASED/EXPIRED', async () => {
      prismaMock.vietSageSyncLog.findUnique.mockResolvedValue({
        status: SyncStatus.PENDING,
        syncType: 'direct_booking_confirm_hold',
        bookingId: 'b-123',
      });

      service.setHttpClient(() => {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              data: {
                confirmed: false,
                hold_status: 'EXPIRED',
              },
            }),
        } as unknown as Response);
      });

      const res = await service.reconcileOperation(
        'confirm-hold:vs-hold:b-123',
      );
      expect(res.reconciled).toBe(true);
      expect(res.status).toBe('FAILED');
      expect(res.error).toBe('HOLD_EXPIRED_OR_RELEASED');
    });
  });

  describe('Inbound Webhook - inventory-updated', () => {
    it('validates HMAC signature and processes inventory adjustments', async () => {
      const path = '/api/v1/vietsage/webhook/inventory-updated';
      const timestamp = Math.floor(Date.now() / 1000);
      const requestId = 'req-webhook-001';
      const payload = {
        property_id: 'prop-001',
        room_type_id: 'room-001',
        adjustments: [
          {
            date: '2026-11-15',
            available_rooms: 4,
            total_rooms: 10,
          },
        ],
      };

      const canonical = computeCanonicalPayload(
        'POST',
        path,
        timestamp,
        requestId,
        payload,
      );
      const secret = service.getHmacSecret();
      const signature = signHmacPayload(canonical, secret);

      const mockReq = {
        path,
        headers: { 'x-request-id': requestId },
      } as any;

      const response = await controller.handleInventoryUpdated(
        `t=${timestamp},v1=${signature}`,
        undefined,
        String(timestamp),
        requestId,
        payload,
        mockReq,
      );

      expect(response.success).toBe(true);
      expect(response.data.roomTypeId).toBe('room-001');
      expect(response.data.processed).toBe(1);
    });

    it('rejects inventory webhook with invalid HMAC signature', async () => {
      const mockReq = {
        path: '/api/v1/vietsage/webhook/inventory-updated',
        headers: {},
      } as any;

      await expect(
        controller.handleInventoryUpdated(
          'invalid-sig',
          undefined,
          String(Math.floor(Date.now() / 1000)),
          'req-002',
          { property_id: 'p1', room_type_id: 'r1', adjustments: [] },
          mockReq,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

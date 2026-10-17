import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotImplementedException } from '@nestjs/common';
import { VietSageSyncController } from './vietsage-sync.controller';
import { VietSageSyncService } from './vietsage-sync.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('VietSageSyncModule', () => {
  let controller: VietSageSyncController;
  let service: VietSageSyncService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VietSageSyncController],
      providers: [
        VietSageSyncService,
        {
          provide: PrismaService,
          useValue: {
            vietSageSyncLog: {
              create: jest.fn(),
              update: jest.fn(),
            },
          },
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

  describe('VietSageSyncService', () => {
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
});

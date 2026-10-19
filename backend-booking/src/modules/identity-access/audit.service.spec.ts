import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: any;

  const adminAccount = {
    id: 'a0000000-0000-0000-0000-000000000001',
    username: 'admin',
    role: 'ADMIN',
  };

  const regularAccount = {
    id: 'b0000000-0000-0000-0000-000000000002',
    username: 'user1',
    role: 'TRAVELER',
  };

  beforeEach(async () => {
    prisma = {
      account: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      auditEvent: {
        create: jest.fn().mockResolvedValue({ id: 'audit-001' }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('uses actorId directly when account exists for valid UUID', async () => {
    prisma.account.findUnique.mockResolvedValue(regularAccount);

    await service.logEvent({
      actorId: regularAccount.id,
      action: 'BOOKING_CREATE',
      boundedContext: 'bookings',
      resourceType: 'Booking',
      resourceId: 'booking-123',
      metadata: { note: 'test' },
    });

    expect(prisma.account.findUnique).toHaveBeenCalledWith({
      where: { id: regularAccount.id },
      select: { id: true },
    });
    expect(prisma.auditEvent.create).toHaveBeenCalledWith({
      data: {
        actorId: regularAccount.id,
        action: 'BOOKING_CREATE',
        boundedContext: 'bookings',
        resourceType: 'Booking',
        resourceId: 'booking-123',
        metadata: { note: 'test' },
      },
    });
  });

  it('resolves ANONYMOUS_GUEST to system admin account to satisfy FK constraint', async () => {
    prisma.account.findFirst.mockResolvedValue(adminAccount);

    await service.logEvent({
      actorId: 'ANONYMOUS_GUEST',
      action: 'BOOKING_CREATE',
      boundedContext: 'bookings',
      resourceType: 'Booking',
      resourceId: 'booking-456',
      metadata: { bookingCode: 'OTA-202610-XYZ' },
    });

    expect(prisma.account.findFirst).toHaveBeenCalledWith({
      where: { OR: [{ username: 'admin' }, { role: 'ADMIN' }] },
      select: { id: true },
    });
    expect(prisma.auditEvent.create).toHaveBeenCalledWith({
      data: {
        actorId: adminAccount.id,
        action: 'BOOKING_CREATE',
        boundedContext: 'bookings',
        resourceType: 'Booking',
        resourceId: 'booking-456',
        metadata: {
          bookingCode: 'OTA-202610-XYZ',
          originalActor: 'ANONYMOUS_GUEST',
          isGuestAction: true,
        },
      },
    });
  });

  it('handles empty database safely without crashing when no account exists', async () => {
    prisma.account.findFirst.mockResolvedValue(null);

    await expect(
      service.logEvent({
        actorId: 'ANONYMOUS_GUEST',
        action: 'BOOKING_CANCEL',
        boundedContext: 'bookings',
        resourceType: 'Booking',
        resourceId: 'booking-789',
      }),
    ).resolves.not.toThrow();

    expect(prisma.auditEvent.create).not.toHaveBeenCalled();
  });
});

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../identity-access/audit.service';
import { VietSageSyncService } from '../vietsage-sync/vietsage-sync.service';
import {
  CreateBookingDto,
  createBookingSchema,
  LookupBookingDto,
  lookupBookingSchema,
  QuoteBookingDto,
  quoteBookingSchema,
  UpdateBookingStatusDto,
  updateBookingStatusSchema,
} from './dto/bookings.dto';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { resolvePropertyScope } from '../../common/auth/property-scope.helper';
import type {
  Booking,
  Property,
  RoomType,
  BookingAddon,
  AddonService,
  Payment,
} from '@prisma/client';

export type BookingWithRelations = Booking & {
  property?: Property | null;
  roomType?: RoomType | null;
  addons?: (BookingAddon & { addonService?: AddonService | null })[];
  payments?: Payment[];
};

const DEPOSIT_RATE_BPS = 3000; // 30% deposit snapshot

function parseStrictCalendarDate(dateStr: string, fieldName: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) {
    throw new BadRequestException(`Định dạng ${fieldName} phải là YYYY-MM-DD`);
  }
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new BadRequestException(
      `${fieldName} không hợp lệ: ngày không tồn tại trong lịch thực tế`,
    );
  }
  const d = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    throw new BadRequestException(
      `${fieldName} không tồn tại trong lịch thực tế (rollover date: ${dateStr})`,
    );
  }
  return d;
}

function dateToYmd(val: Date | string): string {
  if (val instanceof Date) {
    const year = val.getUTCFullYear();
    const month = String(val.getUTCMonth() + 1).padStart(2, '0');
    const day = String(val.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(val).split('T')[0];
}

function extractAssignedRoomNumber(
  specialRequests?: string | null,
): string | null {
  if (!specialRequests) return null;
  const match = /\[Phòng gán:\s*([^\]]+)\]/i.exec(specialRequests);
  return match ? match[1].trim() : null;
}

function normalizePhone(value: string): string {
  const stripped = (value || '').trim().replace(/[\s().-]/g, '');
  if (stripped.startsWith('+84')) return `0${stripped.slice(3)}`;
  if (stripped.startsWith('84') && stripped.length >= 10) {
    return `0${stripped.slice(2)}`;
  }
  return stripped;
}

interface BookingRecordForResponse {
  id: string;
  bookingCode: string;
  propertyId: string;
  property?: { name?: string | null } | null;
  roomType?: { name?: string | null } | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: Date | string;
  checkOut: Date | string;
  nights: number;
  roomSubtotal?: number | null;
  addonSubtotal?: number | null;
  totalPrice: number;
  depositRateBps?: number | null;
  depositAmount?: number | null;
  balanceDue?: number | null;
  currency?: string | null;
  status: string;
  paymentStatus: string;
  holdExpiresAt?: Date | string | null;
  createdAt: Date | string;
}

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    @Optional() private readonly vietSageSyncService?: VietSageSyncService,
  ) {}

  private async calculateStayAndPricing(params: {
    propertyId: string;
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    guests?: number;
    serviceIds?: string[];
  }) {
    const { propertyId, roomTypeId, checkIn, checkOut, guests } = params;

    const checkInDate = parseStrictCalendarDate(checkIn, 'Ngày nhận phòng');
    const checkOutDate = parseStrictCalendarDate(checkOut, 'Ngày trả phòng');

    if (checkOutDate.getTime() <= checkInDate.getTime()) {
      throw new BadRequestException('Ngày trả phòng phải sau ngày nhận phòng');
    }

    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const nights = Math.round(diffTime / (1000 * 60 * 60 * 24));
    if (nights < 1) {
      throw new BadRequestException('Thời gian lưu trú tối thiểu là 1 đêm');
    }

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property || !property.isActive) {
      throw new NotFoundException(
        'Không tìm thấy thông tin khách sạn hoặc khách sạn đã ngừng hoạt động',
      );
    }

    const roomType = await this.prisma.roomType.findUnique({
      where: { id: roomTypeId },
    });
    if (!roomType || !roomType.isActive) {
      throw new NotFoundException(
        'Không tìm thấy thông tin hạng phòng hoặc hạng phòng đã ngừng hoạt động',
      );
    }
    if (roomType.propertyId !== propertyId) {
      throw new BadRequestException('Hạng phòng không thuộc khách sạn đã chọn');
    }

    if (guests && roomType.maxGuests && guests > roomType.maxGuests) {
      throw new BadRequestException(
        `Số lượng khách (${guests}) vượt quá sức chứa tối đa của hạng phòng (${roomType.maxGuests})`,
      );
    }

    // Addon service pruning: totalPrice = roomPrice * nights, addonSubtotal = 0.
    // service_ids in DTO is safely ignored / optional for streamlined, high-conversion guest checkout.
    const addonsTotalPrice = 0;
    const validServices: Array<{ id: string; name: string; price: number }> = [];

    const stayDates: Date[] = [];
    let dateCursor = new Date(checkInDate.getTime());
    while (dateCursor.getTime() < checkOutDate.getTime()) {
      stayDates.push(new Date(dateCursor.getTime()));
      dateCursor = new Date(
        Date.UTC(
          dateCursor.getUTCFullYear(),
          dateCursor.getUTCMonth(),
          dateCursor.getUTCDate() + 1,
        ),
      );
    }

    const dailyPrices: Array<{ date: Date; dateStr: string; price: number }> =
      [];

    if (this.prisma.roomAllotment) {
      const allotments = await this.prisma.roomAllotment.findMany({
        where: {
          roomTypeId: roomTypeId,
          date: { in: stayDates },
        },
      });

      const allotmentsMap = new Map<string, (typeof allotments)[number]>();
      for (const allot of allotments) {
        const dStr = dateToYmd(allot.date);
        allotmentsMap.set(dStr, allot);
      }

      for (const d of stayDates) {
        const dStr = dateToYmd(d);
        const allot = allotmentsMap.get(dStr);

        if (allot) {
          if (allot.isBlocked) {
            throw new BadRequestException(
              `Hạng phòng đã bị khóa bán vào ngày ${dStr}`,
            );
          }
          if (allot.bookedRooms >= allot.totalRooms) {
            throw new BadRequestException(
              `Hạng phòng đã hết chỗ vào ngày ${dStr}`,
            );
          }
          const price =
            typeof allot.price === 'number' && allot.price >= 0
              ? allot.price
              : roomType.basePrice;
          dailyPrices.push({ date: d, dateStr: dStr, price });
        } else {
          dailyPrices.push({
            date: d,
            dateStr: dStr,
            price: roomType.basePrice,
          });
        }
      }
    } else {
      for (const d of stayDates) {
        dailyPrices.push({
          date: d,
          dateStr: dateToYmd(d),
          price: roomType.basePrice,
        });
      }
    }

    const roomTotalPrice = dailyPrices.reduce(
      (sum, item) => sum + item.price,
      0,
    );
    const totalPrice = roomTotalPrice + addonsTotalPrice;
    const depositAmount = Math.round((totalPrice * DEPOSIT_RATE_BPS) / 10000);
    const balanceDue = totalPrice - depositAmount;

    return {
      property,
      roomType,
      checkInDate,
      checkOutDate,
      nights,
      stayDates,
      dailyPrices,
      roomTotalPrice,
      addonsTotalPrice,
      validServices,
      totalPrice,
      depositRateBps: DEPOSIT_RATE_BPS,
      depositAmount,
      balanceDue,
    };
  }

  async getQuote(rawDto: QuoteBookingDto) {
    const parsed = quoteBookingSchema.safeParse(rawDto);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dữ liệu báo giá không hợp lệ',
        details: parsed.error.issues,
      });
    }

    const {
      property_id,
      room_type_id,
      check_in,
      check_out,
      guests,
      guest_count,
      service_ids,
    } = parsed.data;

    const pricing = await this.calculateStayAndPricing({
      propertyId: property_id,
      roomTypeId: room_type_id,
      checkIn: check_in,
      checkOut: check_out,
      guests: guests ?? guest_count,
      serviceIds: service_ids,
    });

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15-minute quote validity

    return {
      property_id: pricing.property.id,
      property_name: pricing.property.name,
      room_type_id: pricing.roomType.id,
      room_type_name: pricing.roomType.name,
      check_in: dateToYmd(pricing.checkInDate),
      check_out: dateToYmd(pricing.checkOutDate),
      nights: pricing.nights,
      daily_prices: pricing.dailyPrices.map((p) => ({
        date: p.dateStr,
        price: p.price,
      })),
      room_subtotal: pricing.roomTotalPrice,
      addon_subtotal: pricing.addonsTotalPrice,
      total_price: pricing.totalPrice,
      deposit_rate_bps: pricing.depositRateBps,
      deposit_amount: pricing.depositAmount,
      balance_due: pricing.balanceDue,
      currency: 'VND',
      is_available: true,
      expires_at: expiresAt.toISOString(),
      booking_conditions: pricing.roomType.bookingConditions ?? null,
    };
  }

  async createBooking(
    rawDto: CreateBookingDto,
    accountId?: string,
    idempotencyKeyParam?: string,
  ) {
    const parsed = createBookingSchema.safeParse(rawDto);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dữ liệu đặt phòng không hợp lệ',
        details: parsed.error.issues,
      });
    }

    const {
      property_id,
      room_type_id,
      guest_name,
      guest_email,
      guest_phone,
      check_in,
      check_out,
      special_requests,
      service_ids,
      idempotency_key,
    } = parsed.data;

    const effectiveIdempotencyKey = idempotencyKeyParam || idempotency_key;

    let requestFingerprint: string | null = null;
    if (effectiveIdempotencyKey) {
      const sortedServices = (service_ids || []).slice().sort();
      const fingerprintPayload = JSON.stringify({
        property_id,
        room_type_id,
        guest_name: guest_name.trim(),
        guest_email: guest_email.trim().toLowerCase(),
        guest_phone: guest_phone.trim(),
        check_in,
        check_out,
        service_ids: sortedServices,
      });
      requestFingerprint = crypto
        .createHash('sha256')
        .update(fingerprintPayload)
        .digest('hex');

      const existingBooking = await this.prisma.booking.findFirst({
        where: { idempotencyKey: effectiveIdempotencyKey },
        include: {
          property: true,
          roomType: true,
          addons: { include: { addonService: true } },
          payments: true,
        },
      });

      if (existingBooking) {
        if (
          existingBooking.requestFingerprint &&
          existingBooking.requestFingerprint !== requestFingerprint
        ) {
          throw new ConflictException(
            'Idempotency key đã được sử dụng với thông tin đặt phòng khác',
          );
        }
        return this.mapBookingToResponse(existingBooking);
      }
    }

    // Authoritative calculation - client-provided total_price is completely ignored
    const pricing = await this.calculateStayAndPricing({
      propertyId: property_id,
      roomTypeId: room_type_id,
      checkIn: check_in,
      checkOut: check_out,
      serviceIds: service_ids,
    });

    // High-entropy random lookup token (32 bytes = 256 bits)
    const rawLookupToken = crypto.randomBytes(32).toString('hex');
    const lookupTokenHash = crypto
      .createHash('sha256')
      .update(rawLookupToken)
      .digest('hex');

    // Unique booking code
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const bookingCode = `OTA-${datePrefix}-${randomHex}`;

    // Hold expiry (30 minutes)
    const holdExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const booking = await this.prisma.$transaction(async (tx) => {
      // Retain allotment ("giữ allotment"): atomically increment bookedRooms with lt: totalRooms
      if (tx.roomAllotment) {
        for (const d of pricing.stayDates) {
          const dStr = dateToYmd(d);
          let existingAllotment = await tx.roomAllotment.findUnique({
            where: {
              roomTypeId_date: {
                roomTypeId: room_type_id,
                date: d,
              },
            },
          });

          if (!existingAllotment) {
            await tx.roomAllotment.createMany({
              data: {
                roomTypeId: room_type_id,
                date: d,
                totalRooms: 10,
                bookedRooms: 0,
                price: pricing.roomType.basePrice,
                isBlocked: false,
              },
              skipDuplicates: true,
            });
            existingAllotment = await tx.roomAllotment.findUnique({
              where: {
                roomTypeId_date: {
                  roomTypeId: room_type_id,
                  date: d,
                },
              },
            });
          }

          if (!existingAllotment || existingAllotment.isBlocked) {
            throw new BadRequestException(
              `Hạng phòng đã bị khóa bán vào ngày ${dStr}`,
            );
          }
          if (existingAllotment.bookedRooms >= existingAllotment.totalRooms) {
            throw new BadRequestException(
              `Hạng phòng đã hết chỗ vào ngày ${dStr}`,
            );
          }

          const updateResult = await tx.roomAllotment.updateMany({
            where: {
              id: existingAllotment.id,
              isBlocked: false,
              totalRooms: existingAllotment.totalRooms,
              bookedRooms: { lt: existingAllotment.totalRooms },
            },
            data: { bookedRooms: { increment: 1 } },
          });

          if (updateResult.count === 0) {
            throw new BadRequestException(
              `Hạng phòng đã hết chỗ vào ngày ${dStr}`,
            );
          }
        }
      }

      const createdBooking = await tx.booking.create({
        data: {
          bookingCode,
          propertyId: property_id,
          roomTypeId: room_type_id,
          accountId: null, // Public anonymous booking has no account
          guestName: guest_name,
          guestEmail: guest_email,
          guestPhone: guest_phone,
          checkIn: pricing.checkInDate,
          checkOut: pricing.checkOutDate,
          nights: pricing.nights,
          roomSubtotal: pricing.roomTotalPrice,
          addonSubtotal: 0,
          totalPrice: pricing.totalPrice,
          depositRateBps: pricing.depositRateBps,
          depositAmount: pricing.depositAmount,
          balanceDue: pricing.balanceDue,
          currency: 'VND',
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          specialRequests: special_requests ?? null,
          idempotencyKey: effectiveIdempotencyKey ?? null,
          requestFingerprint,
          lookupTokenHash,
          holdId: `HOLD-${bookingCode}`,
          holdExpiresAt,
        },
        include: {
          property: true,
          roomType: true,
        },
      });

      return createdBooking;
    });

    await this.auditService.logEvent({
      actorId: accountId ?? 'ANONYMOUS_GUEST',
      action: 'BOOKING_CREATE',
      boundedContext: 'bookings',
      resourceType: 'Booking',
      resourceId: booking.id,
      metadata: {
        bookingCode,
        totalPrice: pricing.totalPrice,
        depositAmount: pricing.depositAmount,
      },
    });

    return this.mapBookingToResponse(booking, rawLookupToken);
  }

  async listBookings(
    filter: {
      status?: string;
      paymentStatus?: string;
      search?: string;
      checkInFrom?: string;
      checkInTo?: string;
      propertyId?: string;
      accountId?: string;
      page?: number;
      pageSize?: number;
    },
    user: AuthenticatedUser,
  ) {
    if (!user) {
      throw new UnauthorizedException(
        'Yêu cầu xác thực tài khoản để truy cập danh sách đặt phòng',
      );
    }

    const scope = resolvePropertyScope(user, filter?.propertyId);

    const page = filter?.page ?? 1;
    const pageSize = filter?.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (scope.propertyId) {
      where.propertyId = scope.propertyId;
    }

    if (filter?.accountId) {
      where.accountId = filter.accountId;
    }

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.paymentStatus) {
      where.paymentStatus = filter.paymentStatus;
    }

    if (filter?.checkInFrom || filter?.checkInTo) {
      const checkInFilter: Record<string, Date> = {};
      if (filter.checkInFrom) {
        checkInFilter.gte = new Date(filter.checkInFrom);
      }
      if (filter.checkInTo) {
        checkInFilter.lte = new Date(filter.checkInTo);
      }
      where.checkIn = checkInFilter;
    }

    if (filter?.search && filter.search.trim()) {
      const term = filter.search.trim();
      where.OR = [
        { bookingCode: { contains: term, mode: 'insensitive' } },
        { guestName: { contains: term, mode: 'insensitive' } },
        { guestEmail: { contains: term, mode: 'insensitive' } },
        { guestPhone: { contains: term } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          property: true,
          roomType: true,
          addons: {
            include: { addonService: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      items: items.map((b) => ({
        id: b.id,
        booking_code: b.bookingCode,
        property_id: b.propertyId,
        property_name: b.property.name,
        room_type_name: b.roomType?.name,
        guest_name: b.guestName,
        guest_email: b.guestEmail,
        guest_phone: b.guestPhone,
        check_in: b.checkIn.toISOString().split('T')[0],
        check_out: b.checkOut.toISOString().split('T')[0],
        nights: b.nights,
        total_price: b.totalPrice,
        status: b.status,
        payment_status: b.paymentStatus,
        special_requests: b.specialRequests,
        addons: b.addons.map((a) => ({
          service_name: a.addonService.name,
          price: a.totalPrice,
        })),
        created_at: b.createdAt.toISOString(),
      })),
      page,
      page_size: pageSize,
      total,
      has_next: skip + items.length < total,
    };
  }

  async getBookingSummary(
    user: AuthenticatedUser,
    filter: {
      propertyId?: string;
      from?: string;
      to?: string;
    },
  ) {
    if (!user) {
      throw new UnauthorizedException(
        'Yêu cầu xác thực tài khoản để xem thống kê đặt phòng',
      );
    }

    const scope = resolvePropertyScope(user, filter?.propertyId);

    const where: Record<string, unknown> = {};

    if (scope.propertyId) {
      where.propertyId = scope.propertyId;
    }

    if (filter?.from || filter?.to) {
      const createdAtFilter: Record<string, Date> = {};
      if (filter.from) {
        createdAtFilter.gte = new Date(filter.from);
      }
      if (filter.to) {
        createdAtFilter.lte = new Date(filter.to);
      }
      where.createdAt = createdAtFilter;
    }

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [aggregate, statusGroups, upcomingCheckinsCount] = await Promise.all([
      this.prisma.booking.aggregate({
        where,
        _count: { id: true },
        _sum: { totalPrice: true },
      }),
      this.prisma.booking.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      this.prisma.booking.count({
        where: {
          ...where,
          checkIn: {
            gte: now,
            lte: in7Days,
          },
          status: { in: ['CONFIRMED', 'PENDING'] },
        },
      }),
    ]);

    let pendingCount = 0;
    let confirmedCount = 0;
    let cancelledCount = 0;

    for (const group of statusGroups) {
      if (group.status === 'PENDING') {
        pendingCount = group._count.id;
      } else if (group.status === 'CONFIRMED') {
        confirmedCount = group._count.id;
      } else if (group.status === 'CANCELLED') {
        cancelledCount = group._count.id;
      }
    }

    return {
      total_bookings: aggregate._count.id ?? 0,
      gross_booking_value: aggregate._sum.totalPrice ?? 0,
      pending_count: pendingCount,
      confirmed_count: confirmedCount,
      cancelled_count: cancelledCount,
      upcoming_checkins_count: upcomingCheckinsCount,
    };
  }

  async getBookingByIdOrCode(idOrCode: string, user: AuthenticatedUser) {
    if (!user) {
      throw new UnauthorizedException(
        'Yêu cầu xác thực tài khoản để xem chi tiết đặt phòng',
      );
    }

    const b = await this.prisma.booking.findFirst({
      where: {
        OR: [{ id: idOrCode }, { bookingCode: idOrCode }],
      },
      include: {
        property: true,
        roomType: true,
        addons: {
          include: { addonService: true },
        },
        payments: true,
      },
    });

    if (!b) {
      throw new NotFoundException('Không tìm thấy thông tin đơn đặt phòng');
    }

    if (user.managedPropertyId && b.propertyId !== user.managedPropertyId) {
      throw new ForbiddenException(
        'Không có quyền truy cập đơn đặt phòng của cơ sở khác',
      );
    }

    return {
      id: b.id,
      booking_code: b.bookingCode,
      property_id: b.propertyId,
      property_name: b.property.name,
      property_address: b.property.address,
      room_type_name: b.roomType?.name,
      guest_name: b.guestName,
      guest_email: b.guestEmail,
      guest_phone: b.guestPhone,
      check_in: b.checkIn.toISOString().split('T')[0],
      check_out: b.checkOut.toISOString().split('T')[0],
      nights: b.nights,
      total_price: b.totalPrice,
      status: b.status,
      payment_status: b.paymentStatus,
      special_requests: b.specialRequests,
      addons: b.addons.map((a) => ({
        service_name: a.addonService.name,
        price: a.totalPrice,
      })),
      payments:
        b.payments?.map((p) => ({
          id: p.id,
          payment_method: p.paymentMethod,
          amount: p.amount,
          status: p.status,
          transaction_ref: p.transactionRef,
          qr_code_url: p.qrCodeUrl,
        })) ?? [],
      created_at: b.createdAt.toISOString(),
    };
  }

  async updateBookingStatus(
    id: string,
    rawDto: UpdateBookingStatusDto,
    user: AuthenticatedUser,
  ) {
    if (!user) {
      throw new UnauthorizedException(
        'Yêu cầu xác thực tài khoản để cập nhật trạng thái',
      );
    }

    const parsed = updateBookingStatusSchema.safeParse(rawDto);
    if (!parsed.success) {
      throw new BadRequestException({
        message:
          'Trạng thái cập nhật không hợp lệ. Chỉ cho phép hủy đơn (CANCELLED)',
        details: parsed.error.issues,
      });
    }

    const { status, reason } = parsed.data;

    const existing = await this.prisma.booking.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy đơn đặt phòng');
    }

    if (
      user.managedPropertyId &&
      existing.propertyId !== user.managedPropertyId
    ) {
      throw new ForbiddenException('Không có quyền thao tác trên cơ sở này');
    }

    // Only allow transition to CANCELLED when status is PENDING and paymentStatus is UNPAID
    if (existing.status !== 'PENDING' || existing.paymentStatus !== 'UNPAID') {
      throw new BadRequestException(
        `Không thể hủy đơn đặt phòng ở trạng thái ${existing.status} (thanh toán: ${existing.paymentStatus}). Chỉ đơn ở trạng thái PENDING và chưa thanh toán (UNPAID) mới có thể hủy.`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.booking.updateMany({
        where: { id, status: 'PENDING', paymentStatus: 'UNPAID' },
        data: { status },
      });

      if (claimed.count !== 1) {
        throw new BadRequestException(
          'Đơn đặt phòng đã được xử lý bởi một yêu cầu khác',
        );
      }

      // Restore allotment if cancelled
      if (status === 'CANCELLED' && existing.roomTypeId && tx.roomAllotment) {
        const cancelDates: Date[] = [];
        let cancelCursor = new Date(existing.checkIn);
        while (cancelCursor.getTime() < existing.checkOut.getTime()) {
          cancelDates.push(new Date(cancelCursor.getTime()));
          cancelCursor = new Date(
            Date.UTC(
              cancelCursor.getUTCFullYear(),
              cancelCursor.getUTCMonth(),
              cancelCursor.getUTCDate() + 1,
            ),
          );
        }

        for (const cd of cancelDates) {
          const allot = await tx.roomAllotment.findUnique({
            where: {
              roomTypeId_date: {
                roomTypeId: existing.roomTypeId,
                date: cd,
              },
            },
          });

          if (allot && allot.bookedRooms > 0) {
            await tx.roomAllotment.updateMany({
              where: { id: allot.id, bookedRooms: { gt: 0 } },
              data: { bookedRooms: { decrement: 1 } },
            });
          }
        }
      }

      return {
        id: existing.id,
        bookingCode: existing.bookingCode,
        status,
        updatedAt: new Date(),
      };
    });

    await this.auditService.logEvent({
      actorId: user.id,
      action: 'BOOKING_CANCEL',
      boundedContext: 'bookings',
      resourceType: 'Booking',
      resourceId: id,
      metadata: { previous: existing.status, next: status, reason },
    });

    if (existing.holdId && this.vietSageSyncService) {
      try {
        await this.vietSageSyncService.releaseHold(
          existing.holdId,
          reason ?? 'STAFF_CANCELLED',
        );
      } catch (err) {
        this.logger.warn(
          `Failed to release VietSage hold ${existing.holdId}: ${err}`,
        );
      }
    }

    return {
      id: updated.id,
      booking_code: updated.bookingCode,
      status: updated.status,
      updated_at: updated.updatedAt.toISOString(),
    };
  }

  private mapBookingToLookupResult(booking: any) {
    return {
      id: booking.id,
      booking_code: booking.bookingCode,
      property_id: booking.propertyId,
      property_name: booking.property?.name ?? '',
      property_address: booking.property?.address ?? null,
      property_city: booking.property?.city ?? null,
      room_type_name: booking.roomType?.name ?? null,
      guest_name: booking.guestName,
      guest_email: booking.guestEmail,
      guest_phone: booking.guestPhone,
      check_in: dateToYmd(booking.checkIn),
      check_out: dateToYmd(booking.checkOut),
      nights: booking.nights,
      room_subtotal: booking.roomSubtotal ?? booking.totalPrice,
      addon_subtotal: booking.addonSubtotal ?? 0,
      total_price: booking.totalPrice,
      deposit_rate_bps: booking.depositRateBps ?? DEPOSIT_RATE_BPS,
      deposit_amount:
        booking.depositAmount ??
        Math.round(
          ((booking.totalPrice ?? 0) *
            (booking.depositRateBps ?? DEPOSIT_RATE_BPS)) /
            10000,
        ),
      balance_due:
        booking.balanceDue ??
        booking.totalPrice -
          (booking.depositAmount ??
            Math.round(
              ((booking.totalPrice ?? 0) *
                (booking.depositRateBps ?? DEPOSIT_RATE_BPS)) /
                10000,
            )),
      currency: booking.currency ?? 'VND',
      status: booking.status,
      payment_status: booking.paymentStatus,
      assigned_room_number: extractAssignedRoomNumber(booking.specialRequests),
      special_requests: booking.specialRequests,
      addons:
        booking.addons?.map((a: any) => ({
          service_name: a.addonService?.name ?? '',
          price: a.totalPrice,
        })) ?? [],
      payments:
        booking.payments?.map((p: any) => ({
          id: p.id,
          payment_method: p.paymentMethod,
          amount: p.amount,
          status: p.status,
          transaction_ref: p.transactionRef,
          qr_code_url: p.qrCodeUrl,
        })) ?? [],
      created_at: booking.createdAt.toISOString(),
    };
  }

  async lookupBookingsByPhone(phoneInput: string, includePast = false) {
    const cleanPhone = normalizePhone(phoneInput);
    const digits = cleanPhone.replace(/\D/g, '');

    if (digits.length < 8) {
      throw new BadRequestException(
        'Số điện thoại không hợp lệ (tối thiểu 8 chữ số)',
      );
    }

    const prefix4 = digits.length >= 4 ? digits.slice(0, 4) : digits;
    const suffix4 = digits.length >= 8 ? digits.slice(-4) : digits;

    const candidates = await this.prisma.booking.findMany({
      where: {
        OR: [
          { guestPhone: { contains: phoneInput.trim() } },
          { guestPhone: { contains: cleanPhone } },
          { guestPhone: { contains: digits } },
          { guestPhone: { contains: prefix4 } },
          { guestPhone: { contains: suffix4 } },
        ],
      },
      include: {
        property: true,
        roomType: true,
        addons: {
          include: { addonService: true },
        },
        payments: true,
      },
      orderBy: [{ checkIn: 'asc' }, { createdAt: 'desc' }],
    });

    const matched = candidates.filter((b) => {
      const bDigits = normalizePhone(b.guestPhone || '').replace(/\D/g, '');
      if (!bDigits) return false;
      return (
        bDigits === digits ||
        (digits.length >= 9 && bDigits.endsWith(digits.slice(-9)))
      );
    });

    let activeBookings = matched;
    if (!includePast) {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const todayStr = formatter.format(new Date());

      activeBookings = matched.filter((b) => {
        const checkOutStr = dateToYmd(b.checkOut);
        return checkOutStr >= todayStr;
      });
    }

    const items = activeBookings.map((b) => this.mapBookingToLookupResult(b));
    return {
      items,
      total: items.length,
      ...(items.length === 1 ? items[0] : {}),
    };
  }

  async lookupBooking(
    bookingCodeOrDto: string | LookupBookingDto,
    lookupTokenArg?: string,
  ) {
    let bookingCode = '';
    let lookupToken = '';
    let contact = '';
    let phone = '';
    let includePast = false;

    if (typeof bookingCodeOrDto === 'string') {
      bookingCode = bookingCodeOrDto;
      lookupToken = lookupTokenArg ?? '';
    } else {
      const parsed = lookupBookingSchema.safeParse(bookingCodeOrDto);
      if (!parsed.success) {
        throw new BadRequestException({
          message: 'Dữ liệu tra cứu đơn đặt phòng không hợp lệ',
          details: parsed.error.issues,
        });
      }
      bookingCode = parsed.data.booking_code ?? '';
      lookupToken =
        parsed.data.lookup_token || parsed.data.token || lookupTokenArg || '';
      contact = parsed.data.contact ?? '';
      phone = parsed.data.phone ?? '';
      includePast = parsed.data.include_past ?? false;
    }

    const cleanCode = bookingCode.trim();
    const cleanToken = lookupToken.trim();
    const cleanPhoneInput = (phone || (!cleanCode ? contact : '')).trim();

    // If only phone/contact is provided without booking code, search by phone
    if (cleanPhoneInput && !cleanCode) {
      return this.lookupBookingsByPhone(cleanPhoneInput, includePast);
    }

    if (!cleanCode) {
      throw new BadRequestException(
        'Vui lòng cung cấp số điện thoại hoặc mã đơn đặt phòng',
      );
    }

    // Require token or phone capability
    if (!cleanToken && !cleanPhoneInput) {
      throw new NotFoundException('Không tìm thấy thông tin đơn đặt phòng');
    }

    const booking = await this.prisma.booking.findFirst({
      where: { bookingCode: cleanCode },
      include: {
        property: true,
        roomType: true,
        addons: {
          include: { addonService: true },
        },
        payments: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy thông tin đơn đặt phòng');
    }

    // Capability check: phone match OR constant-time hash check
    const guestPhone = normalizePhone(booking.guestPhone || '');
    const inputPhone = normalizePhone(cleanPhoneInput || cleanToken);
    const isPhoneMatch = inputPhone.length >= 8 && guestPhone === inputPhone;

    if (!isPhoneMatch) {
      if (!cleanToken || !booking.lookupTokenHash) {
        throw new NotFoundException('Không tìm thấy thông tin đơn đặt phòng');
      }

      const inputHash = crypto.createHash('sha256').update(cleanToken).digest();
      let storedHash: Buffer;
      try {
        storedHash = Buffer.from(booking.lookupTokenHash, 'hex');
      } catch {
        throw new NotFoundException('Không tìm thấy thông tin đơn đặt phòng');
      }

      if (
        storedHash.length !== inputHash.length ||
        !crypto.timingSafeEqual(storedHash, inputHash)
      ) {
        throw new NotFoundException('Không tìm thấy thông tin đơn đặt phòng');
      }
    }

    const mapped = this.mapBookingToLookupResult(booking);
    return {
      ...mapped,
      items: [mapped],
      total: 1,
    };
  }

  async cancelBooking(
    bookingCode: string,
    lookupToken: string,
    reason?: string,
  ) {
    const cleanCode = (bookingCode || '').trim();
    const cleanToken = (lookupToken || '').trim();

    if (!cleanCode || !cleanToken) {
      throw new NotFoundException('Không tìm thấy thông tin đơn đặt phòng');
    }

    const booking = await this.prisma.booking.findFirst({
      where: { bookingCode: cleanCode },
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy thông tin đơn đặt phòng');
    }

    // Verify phone match OR constant-time hash check
    const guestPhone = normalizePhone(booking.guestPhone || '');
    const inputPhone = normalizePhone(cleanToken);
    const isPhoneMatch = inputPhone.length >= 8 && guestPhone === inputPhone;

    if (!isPhoneMatch) {
      if (!booking.lookupTokenHash) {
        throw new NotFoundException('Không tìm thấy thông tin đơn đặt phòng');
      }
      const inputHash = crypto.createHash('sha256').update(cleanToken).digest();
      let storedHash: Buffer;
      try {
        storedHash = Buffer.from(booking.lookupTokenHash, 'hex');
      } catch {
        throw new NotFoundException('Không tìm thấy thông tin đơn đặt phòng');
      }

      if (
        storedHash.length !== inputHash.length ||
        !crypto.timingSafeEqual(storedHash, inputHash)
      ) {
        throw new NotFoundException('Không tìm thấy thông tin đơn đặt phòng');
      }
    }

    if (booking.status !== 'PENDING') {
      throw new BadRequestException(
        `Không thể hủy đơn đặt phòng ở trạng thái ${booking.status}. Chỉ đơn ở trạng thái PENDING mới có thể hủy.`,
      );
    }

    if (booking.paymentStatus !== 'UNPAID') {
      throw new BadRequestException(
        'Đơn đặt phòng đã được thanh toán, vui lòng liên hệ nhân viên để được hỗ trợ',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.booking.updateMany({
        where: { id: booking.id, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      });

      if (claimed.count !== 1) {
        throw new BadRequestException(
          'Đơn đặt phòng đã được xử lý bởi một yêu cầu khác',
        );
      }

      if (booking.roomTypeId && tx.roomAllotment) {
        const cancelDates: Date[] = [];
        let cancelCursor = new Date(booking.checkIn);
        while (cancelCursor.getTime() < booking.checkOut.getTime()) {
          cancelDates.push(new Date(cancelCursor.getTime()));
          cancelCursor = new Date(
            Date.UTC(
              cancelCursor.getUTCFullYear(),
              cancelCursor.getUTCMonth(),
              cancelCursor.getUTCDate() + 1,
            ),
          );
        }

        for (const cd of cancelDates) {
          const allot = await tx.roomAllotment.findUnique({
            where: {
              roomTypeId_date: {
                roomTypeId: booking.roomTypeId,
                date: cd,
              },
            },
          });

          if (allot && allot.bookedRooms > 0) {
            await tx.roomAllotment.updateMany({
              where: { id: allot.id, bookedRooms: { gt: 0 } },
              data: { bookedRooms: { decrement: 1 } },
            });
          }
        }
      }

      return {
        id: booking.id,
        bookingCode: booking.bookingCode,
        status: 'CANCELLED',
        updatedAt: new Date(),
      };
    });

    await this.auditService.logEvent({
      actorId: 'ANONYMOUS_GUEST',
      action: 'BOOKING_CANCEL',
      boundedContext: 'bookings',
      resourceType: 'Booking',
      resourceId: booking.id,
      metadata: {
        bookingCode: booking.bookingCode,
        previous: booking.status,
        next: 'CANCELLED',
        reason,
      },
    });

    if (booking.holdId && this.vietSageSyncService) {
      try {
        await this.vietSageSyncService.releaseHold(
          booking.holdId,
          reason ?? 'GUEST_CANCELLED',
        );
      } catch (err) {
        this.logger.warn(
          `Failed to release VietSage hold ${booking.holdId}: ${err}`,
        );
      }
    }

    return {
      id: updated.id,
      booking_code: updated.bookingCode,
      status: updated.status,
      updated_at: updated.updatedAt.toISOString(),
    };
  }

  private mapBookingToResponse(
    booking: BookingRecordForResponse,
    rawLookupToken?: string,
  ) {
    const depositAmount =
      booking.depositAmount ??
      Math.round(((booking.totalPrice ?? 0) * DEPOSIT_RATE_BPS) / 10000);
    const balanceDue =
      booking.balanceDue ??
      Math.max(0, (booking.totalPrice ?? 0) - depositAmount);

    return {
      id: booking.id,
      booking_code: booking.bookingCode,
      ...(rawLookupToken ? { lookup_token: rawLookupToken } : {}),
      property_id: booking.propertyId,
      property_name: booking.property?.name,
      room_type_name: booking.roomType?.name,
      guest_name: booking.guestName,
      guest_email: booking.guestEmail,
      guest_phone: booking.guestPhone,
      check_in: dateToYmd(booking.checkIn),
      check_out: dateToYmd(booking.checkOut),
      nights: booking.nights,
      room_subtotal: booking.roomSubtotal ?? booking.totalPrice,
      addon_subtotal: booking.addonSubtotal ?? 0,
      total_price: booking.totalPrice,
      deposit_rate_bps: booking.depositRateBps ?? DEPOSIT_RATE_BPS,
      deposit_amount: depositAmount,
      balance_due: balanceDue,
      currency: booking.currency ?? 'VND',
      status: booking.status,
      payment_status: booking.paymentStatus,
      hold_expires_at: booking.holdExpiresAt
        ? new Date(booking.holdExpiresAt).toISOString()
        : undefined,
      created_at: new Date(booking.createdAt).toISOString(),
    };
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../identity-access/audit.service';
import {
  CreateBookingDto,
  createBookingSchema,
  LookupBookingDto,
  lookupBookingSchema,
  UpdateBookingStatusDto,
  updateBookingStatusSchema,
} from './dto/bookings.dto';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';

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

function getPhoneLookupCandidates(contact: string): string[] {
  const trimmed = contact.trim();
  const candidates = new Set<string>();
  candidates.add(trimmed);

  const stripped = trimmed.replace(/[\s().-]/g, '');
  if (stripped) {
    candidates.add(stripped);

    if (stripped.startsWith('+84')) {
      const rest = stripped.slice(3);
      candidates.add(`0${rest}`);
      candidates.add(`84${rest}`);
    } else if (stripped.startsWith('84') && stripped.length >= 10) {
      const rest = stripped.slice(2);
      candidates.add(`0${rest}`);
      candidates.add(`+84${rest}`);
    } else if (stripped.startsWith('0') && stripped.length >= 9) {
      const rest = stripped.slice(1);
      candidates.add(`+84${rest}`);
      candidates.add(`84${rest}`);
    }
  }

  return Array.from(candidates);
}

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createBooking(rawDto: CreateBookingDto, accountId?: string) {
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
    } = parsed.data;

    // 1. Date validation (Authoritative, strict calendar date validation prevents rollover dates)
    const checkInDate = parseStrictCalendarDate(check_in, 'Ngày nhận phòng');
    const checkOutDate = parseStrictCalendarDate(check_out, 'Ngày trả phòng');

    if (checkOutDate.getTime() <= checkInDate.getTime()) {
      throw new BadRequestException('Ngày trả phòng phải sau ngày nhận phòng');
    }

    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const nights = Math.round(diffTime / (1000 * 60 * 60 * 24));
    if (nights < 1) {
      throw new BadRequestException('Thời gian lưu trú tối thiểu là 1 đêm');
    }

    // 2. Property validation
    const property = await this.prisma.property.findUnique({
      where: { id: property_id },
    });
    if (!property || !property.isActive) {
      throw new NotFoundException(
        'Không tìm thấy thông tin khách sạn hoặc khách sạn đã ngừng hoạt động',
      );
    }

    // 3. RoomType authoritative source
    const roomType = await this.prisma.roomType.findUnique({
      where: { id: room_type_id },
    });
    if (!roomType || !roomType.isActive) {
      throw new NotFoundException(
        'Không tìm thấy thông tin hạng phòng hoặc hạng phòng đã ngừng hoạt động',
      );
    }
    if (roomType.propertyId !== property_id) {
      throw new BadRequestException('Hạng phòng không thuộc khách sạn đã chọn');
    }

    // 4. Addon services validation & pricing
    let addonsTotalPrice = 0;
    let validServices: Array<{ id: string; name: string; price: number }> = [];

    if (service_ids && service_ids.length > 0) {
      const uniqueIds = Array.from(new Set(service_ids));
      validServices = await this.prisma.addonService.findMany({
        where: { id: { in: uniqueIds }, isActive: true },
        select: { id: true, name: true, price: true },
      });

      if (validServices.length !== uniqueIds.length) {
        throw new BadRequestException(
          'Một hoặc nhiều dịch vụ đi kèm không hợp lệ hoặc đã ngừng cung cấp',
        );
      }

      addonsTotalPrice = validServices.reduce((sum, s) => sum + s.price, 0);
    }

    // 5. RoomAllotment guard, stay dates & authoritative per-day pricing
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

    // Authoritative per-day allotment prices with documented base-price fallback
    const dailyPrices: Array<{ date: Date; dateStr: string; price: number }> =
      [];

    if (this.prisma.roomAllotment) {
      const allotments = await this.prisma.roomAllotment.findMany({
        where: {
          roomTypeId: room_type_id,
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
          // Authoritative per-day allotment price
          const price =
            typeof allot.price === 'number' && allot.price >= 0
              ? allot.price
              : roomType.basePrice;
          dailyPrices.push({ date: d, dateStr: dStr, price });
        } else {
          // Documented fallback: when no allotment is defined for the day, fall back to roomType.basePrice
          dailyPrices.push({
            date: d,
            dateStr: dStr,
            price: roomType.basePrice,
          });
        }
      }
    } else {
      // Documented fallback: when roomAllotment delegate is absent, fall back to roomType.basePrice
      for (const d of stayDates) {
        dailyPrices.push({
          date: d,
          dateStr: dateToYmd(d),
          price: roomType.basePrice,
        });
      }
    }

    // Authoritative total price calculated on server: Sum of daily allotment prices (with basePrice fallback) + Active Addons
    const roomTotalPrice = dailyPrices.reduce(
      (sum, item) => sum + item.price,
      0,
    );
    const serverCalculatedTotalPrice = roomTotalPrice + addonsTotalPrice;

    // Generate unique OTA booking code: OTA-YYYYMM-XXXX
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const bookingCode = `OTA-${datePrefix}-${randomHex}`;

    // 6. Atomic write with transaction: concurrency-safe capacity reservation
    const booking = await this.prisma.$transaction(async (tx) => {
      // Deduct room allotment quota atomically with concurrency protection
      if (tx.roomAllotment) {
        for (const d of stayDates) {
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
            // ON CONFLICT DO NOTHING avoids poisoning the PostgreSQL transaction
            // when two bookings initialize the same date concurrently.
            await tx.roomAllotment.createMany({
              data: {
                roomTypeId: room_type_id,
                date: d,
                totalRooms: 10,
                bookedRooms: 0,
                price: roomType.basePrice,
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
          accountId: accountId ?? null,
          guestName: guest_name,
          guestEmail: guest_email,
          guestPhone: guest_phone,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          nights,
          totalPrice: serverCalculatedTotalPrice,
          specialRequests: special_requests ?? null,
          status: 'PENDING',
        },
        include: {
          property: true,
          roomType: true,
        },
      });

      if (validServices.length > 0) {
        for (const s of validServices) {
          await tx.bookingAddon.create({
            data: {
              bookingId: createdBooking.id,
              addonServiceId: s.id,
              quantity: 1,
              unitPrice: s.price,
              totalPrice: s.price,
            },
          });
        }
      }

      return createdBooking;
    });

    if (accountId) {
      await this.auditService.logEvent({
        actorId: accountId,
        action: 'BOOKING_CREATE',
        boundedContext: 'bookings',
        resourceType: 'Booking',
        resourceId: booking.id,
        metadata: { bookingCode, totalPrice: serverCalculatedTotalPrice },
      });
    }

    return {
      id: booking.id,
      booking_code: booking.bookingCode,
      property_id: booking.propertyId,
      property_name: booking.property.name,
      room_type_name: booking.roomType?.name,
      guest_name: booking.guestName,
      guest_email: booking.guestEmail,
      guest_phone: booking.guestPhone,
      check_in: booking.checkIn.toISOString().split('T')[0],
      check_out: booking.checkOut.toISOString().split('T')[0],
      nights: booking.nights,
      total_price: booking.totalPrice,
      status: booking.status,
      payment_status: booking.paymentStatus,
      created_at: booking.createdAt.toISOString(),
    };
  }

  async listBookings(
    filter: {
      status?: string;
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

    const page = filter?.page ?? 1;
    const pageSize = filter?.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (user.role === 'HOTEL_PARTNER') {
      const partnerAccount = this.prisma.account
        ? await this.prisma.account.findUnique({ where: { id: user.id } })
        : null;
      if (!partnerAccount?.managedPropertyId) {
        throw new ForbiddenException(
          'Tài khoản đối tác khách sạn chưa được hỗ trợ tra cứu booking do chưa có ánh xạ khách sạn quản lý',
        );
      }
      where.propertyId = partnerAccount.managedPropertyId;
    } else if (user.role === 'TRAVELER') {
      // TRAVELER can only view bookings associated with their own account
      where.accountId = user.id;
    } else if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      if (filter?.accountId) {
        where.accountId = filter.accountId;
      }
    } else {
      throw new ForbiddenException(
        'Vai trò người dùng không có quyền truy cập',
      );
    }

    if (filter?.status) {
      where.status = filter.status;
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

    if (user.role === 'HOTEL_PARTNER') {
      const partnerAccount = this.prisma.account
        ? await this.prisma.account.findUnique({ where: { id: user.id } })
        : null;
      if (
        !partnerAccount?.managedPropertyId ||
        b.propertyId !== partnerAccount.managedPropertyId
      ) {
        throw new ForbiddenException(
          'Tài khoản đối tác khách sạn chưa được hỗ trợ tra cứu booking do chưa có ánh xạ khách sạn quản lý',
        );
      }
    } else if (user.role === 'TRAVELER' && b.accountId !== user.id) {
      throw new NotFoundException('Không tìm thấy thông tin đơn đặt phòng');
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

    if (user.role === 'HOTEL_PARTNER') {
      const partnerAccount = this.prisma.account
        ? await this.prisma.account.findUnique({ where: { id: user.id } })
        : null;
      if (
        !partnerAccount?.managedPropertyId ||
        existing.propertyId !== partnerAccount.managedPropertyId
      ) {
        throw new ForbiddenException(
          'Tài khoản đối tác khách sạn chưa được hỗ trợ thay đổi trạng thái booking',
        );
      }
    } else if (user.role === 'TRAVELER' && existing.accountId !== user.id) {
      throw new NotFoundException('Không tìm thấy đơn đặt phòng');
    }

    // Only allow transition PENDING -> CANCELLED locally
    if (existing.status !== 'PENDING') {
      throw new BadRequestException(
        `Không thể hủy đơn đặt phòng ở trạng thái ${existing.status}. Chỉ đơn ở trạng thái PENDING mới có thể hủy.`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.booking.updateMany({
        where: { id, status: 'PENDING' },
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

    return {
      id: updated.id,
      booking_code: updated.bookingCode,
      status: updated.status,
      updated_at: updated.updatedAt.toISOString(),
    };
  }

  async lookupBooking(rawDto: LookupBookingDto) {
    const parsed = lookupBookingSchema.safeParse(rawDto);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dữ liệu tra cứu đơn đặt phòng không hợp lệ',
        details: parsed.error.issues,
      });
    }

    const cleanCode = parsed.data.booking_code.trim();
    const cleanContact = parsed.data.contact.trim();

    // Exact normalized contact matching:
    // Email is normalized (case-insensitive exact match).
    // Phone lookup uses exact candidate values from standard normalization; NEVER substring matching.
    const phoneCandidates = getPhoneLookupCandidates(cleanContact);

    const booking = await this.prisma.booking.findFirst({
      where: {
        bookingCode: cleanCode,
        OR: [
          { guestEmail: { equals: cleanContact, mode: 'insensitive' } },
          { guestPhone: { in: phoneCandidates } },
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
    });

    if (!booking) {
      throw new NotFoundException(
        'Không tìm thấy thông tin đơn đặt phòng khớp với mã đặt và thông tin liên hệ',
      );
    }

    const emailMatches =
      booking.guestEmail.trim().toLowerCase() === cleanContact.toLowerCase();
    const bookingPhoneClean = booking.guestPhone.trim();
    const bookingPhoneStripped = bookingPhoneClean.replace(/[\s().-]/g, '');
    const phoneMatches =
      phoneCandidates.includes(bookingPhoneClean) ||
      phoneCandidates.includes(bookingPhoneStripped);

    if (!emailMatches && !phoneMatches) {
      throw new NotFoundException(
        'Không tìm thấy thông tin đơn đặt phòng khớp với mã đặt và thông tin liên hệ',
      );
    }

    return {
      id: booking.id,
      booking_code: booking.bookingCode,
      property_id: booking.propertyId,
      property_name: booking.property.name,
      property_address: booking.property.address,
      room_type_name: booking.roomType?.name,
      guest_name: booking.guestName,
      guest_email: booking.guestEmail,
      guest_phone: booking.guestPhone,
      check_in: booking.checkIn.toISOString().split('T')[0],
      check_out: booking.checkOut.toISOString().split('T')[0],
      nights: booking.nights,
      total_price: booking.totalPrice,
      status: booking.status,
      payment_status: booking.paymentStatus,
      special_requests: booking.specialRequests,
      addons: booking.addons.map((a) => ({
        service_name: a.addonService.name,
        price: a.totalPrice,
      })),
      payments:
        booking.payments?.map((p) => ({
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
}

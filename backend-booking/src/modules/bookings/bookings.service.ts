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
  UpdateBookingStatusDto,
  updateBookingStatusSchema,
} from './dto/bookings.dto';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';

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

    // 1. Date validation (Authoritative)
    const checkInDate = new Date(`${check_in}T00:00:00Z`);
    const checkOutDate = new Date(`${check_out}T00:00:00Z`);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      throw new BadRequestException('Định dạng ngày nhận phòng hoặc trả phòng không hợp lệ');
    }

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
      throw new NotFoundException('Không tìm thấy thông tin khách sạn hoặc khách sạn đã ngừng hoạt động');
    }

    // 3. RoomType authoritative source & price calculation
    const roomType = await this.prisma.roomType.findUnique({
      where: { id: room_type_id },
    });
    if (!roomType || !roomType.isActive) {
      throw new NotFoundException('Không tìm thấy thông tin hạng phòng hoặc hạng phòng đã ngừng hoạt động');
    }
    if (roomType.propertyId !== property_id) {
      throw new BadRequestException('Hạng phòng không thuộc khách sạn đã chọn');
    }

    const roomTotalPrice = roomType.basePrice * nights;

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
        throw new BadRequestException('Một hoặc nhiều dịch vụ đi kèm không hợp lệ hoặc đã ngừng cung cấp');
      }

      addonsTotalPrice = validServices.reduce((sum, s) => sum + s.price, 0);
    }

    // Authoritative total price calculated on server: Base Price * Nights + Active Addons
    const serverCalculatedTotalPrice = roomTotalPrice + addonsTotalPrice;

    // Generate unique OTA booking code: OTA-YYYYMM-XXXX
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const bookingCode = `OTA-${datePrefix}-${randomHex}`;

    // 5. Atomic write with transaction
    const booking = await this.prisma.$transaction(async (tx) => {
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
      throw new UnauthorizedException('Yêu cầu xác thực tài khoản để truy cập danh sách đặt phòng');
    }

    if (user.role === 'HOTEL_PARTNER') {
      throw new ForbiddenException(
        'Tài khoản đối tác khách sạn chưa được hỗ trợ tra cứu booking do chưa có ánh xạ khách sạn quản lý',
      );
    }

    const page = filter?.page ?? 1;
    const pageSize = filter?.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (user.role === 'TRAVELER') {
      // TRAVELER can only view bookings associated with their own account
      where.accountId = user.id;
    } else if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      if (filter?.accountId) {
        where.accountId = filter.accountId;
      }
    } else {
      throw new ForbiddenException('Vai trò người dùng không có quyền truy cập');
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
      throw new UnauthorizedException('Yêu cầu xác thực tài khoản để xem chi tiết đặt phòng');
    }

    if (user.role === 'HOTEL_PARTNER') {
      throw new ForbiddenException(
        'Tài khoản đối tác khách sạn chưa được hỗ trợ tra cứu booking do chưa có ánh xạ khách sạn quản lý',
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
      },
    });

    if (!b) {
      throw new NotFoundException('Không tìm thấy thông tin đơn đặt phòng');
    }

    // Traveler can only access their own booking
    if (user.role === 'TRAVELER' && b.accountId !== user.id) {
      throw new NotFoundException('Không tìm thấy thông tin đơn đặt phòng');
    }

    return {
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
      special_requests: b.specialRequests,
      addons: b.addons.map((a) => ({
        service_name: a.addonService.name,
        price: a.totalPrice,
      })),
      created_at: b.createdAt.toISOString(),
    };
  }

  async updateBookingStatus(
    id: string,
    rawDto: UpdateBookingStatusDto,
    user: AuthenticatedUser,
  ) {
    if (!user) {
      throw new UnauthorizedException('Yêu cầu xác thực tài khoản để cập nhật trạng thái');
    }

    if (user.role === 'HOTEL_PARTNER') {
      throw new ForbiddenException(
        'Tài khoản đối tác khách sạn chưa được hỗ trợ thay đổi trạng thái booking',
      );
    }

    const parsed = updateBookingStatusSchema.safeParse(rawDto);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Trạng thái cập nhật không hợp lệ. Chỉ cho phép hủy đơn (CANCELLED)',
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

    // Traveler can only cancel their own booking
    if (user.role === 'TRAVELER' && existing.accountId !== user.id) {
      throw new NotFoundException('Không tìm thấy đơn đặt phòng');
    }

    // Only allow transition PENDING -> CANCELLED locally
    if (existing.status !== 'PENDING') {
      throw new BadRequestException(
        `Không thể hủy đơn đặt phòng ở trạng thái ${existing.status}. Chỉ đơn ở trạng thái PENDING mới có thể hủy.`,
      );
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status },
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
}

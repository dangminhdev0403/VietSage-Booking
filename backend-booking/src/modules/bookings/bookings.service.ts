import {
  BadRequestException,
  Injectable,
  NotFoundException,
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
      total_price,
      special_requests,
      service_ids,
    } = parsed.data;

    const property = await this.prisma.property.findUnique({
      where: { id: property_id },
    });
    if (!property) {
      throw new NotFoundException('Không tìm thấy thông tin khách sạn');
    }

    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Generate unique OTA booking code: OTA-YYYYMM-XXXX
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const bookingCode = `OTA-${datePrefix}-${randomHex}`;

    const booking = await this.prisma.booking.create({
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
        totalPrice: total_price,
        specialRequests: special_requests,
        status: 'PENDING',
      },
      include: {
        property: true,
        roomType: true,
      },
    });

    if (service_ids && service_ids.length > 0) {
      const services = await this.prisma.addonService.findMany({
        where: { id: { in: service_ids } },
      });

      for (const s of services) {
        await this.prisma.bookingAddon.create({
          data: {
            bookingId: booking.id,
            addonServiceId: s.id,
            quantity: 1,
            unitPrice: s.price,
            totalPrice: s.price,
          },
        });
      }
    }

    if (accountId) {
      await this.auditService.logEvent({
        actorId: accountId,
        action: 'BOOKING_CREATE',
        boundedContext: 'bookings',
        resourceType: 'Booking',
        resourceId: booking.id,
        metadata: { bookingCode, total_price },
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

  async listBookings(filter?: {
    status?: string;
    accountId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = filter?.page ?? 1;
    const pageSize = filter?.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (filter?.status) {
      where.status = filter.status;
    }
    if (filter?.accountId) {
      where.accountId = filter.accountId;
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

  async getBookingByIdOrCode(idOrCode: string) {
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
    actorId?: string,
  ) {
    const parsed = updateBookingStatusSchema.safeParse(rawDto);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Trạng thái cập nhật không hợp lệ',
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

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: status as any },
    });

    if (actorId) {
      await this.auditService.logEvent({
        actorId,
        action: 'BOOKING_STATUS_UPDATE',
        boundedContext: 'bookings',
        resourceType: 'Booking',
        resourceId: id,
        metadata: { previous: existing.status, next: status, reason },
      });
    }

    return {
      id: updated.id,
      booking_code: updated.bookingCode,
      status: updated.status,
      updated_at: updated.updatedAt.toISOString(),
    };
  }
}

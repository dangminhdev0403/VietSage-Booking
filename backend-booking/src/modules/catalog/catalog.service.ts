import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Prisma, RoomAllotment } from '@prisma/client';
import {
  type CreatePropertyDto,
  createPropertySchema,
  type CreateServiceDto,
  createServiceSchema,
  type UpdateAllotmentDto,
  updateAllotmentSchema,
} from './dto/catalog.dto';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { resolvePropertyScope } from '../../common/auth/property-scope.helper';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listProperties(filter?: {
    city?: string;
    keyword?: string;
    min_price?: number;
    max_price?: number;
    star_rating?: number;
    guests?: number;
    sort_by?: 'price_asc' | 'price_desc' | 'rating_desc' | 'newest';
    page?: number;
    pageSize?: number;
  }) {
    const page = filter?.page ?? 1;
    const pageSize = filter?.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: Prisma.PropertyWhereInput = { isActive: true };
    if (filter?.city) {
      where.city = { contains: filter.city, mode: 'insensitive' };
    }
    if (filter?.keyword) {
      where.OR = [
        { name: { contains: filter.keyword, mode: 'insensitive' } },
        { description: { contains: filter.keyword, mode: 'insensitive' } },
        { city: { contains: filter.keyword, mode: 'insensitive' } },
      ];
    }
    if (filter?.star_rating) {
      where.starRating = { gte: Number(filter.star_rating) };
    }
    if (filter?.min_price || filter?.max_price || filter?.guests) {
      where.roomTypes = {
        some: {
          isActive: true,
          ...(filter.min_price
            ? { basePrice: { gte: Number(filter.min_price) } }
            : {}),
          ...(filter.max_price
            ? { basePrice: { lte: Number(filter.max_price) } }
            : {}),
          ...(filter.guests
            ? { maxGuests: { gte: Number(filter.guests) } }
            : {}),
        },
      };
    }

    let orderBy: Prisma.PropertyOrderByWithRelationInput = {
      createdAt: 'desc',
    };
    if (filter?.sort_by === 'rating_desc') {
      orderBy = { starRating: 'desc' };
    }

    const [items, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          address: true,
          description: true,
          starRating: true,
          thumbnailUrl: true,
          images: true,
          createdAt: true,
          roomTypes: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              description: true,
              maxGuests: true,
              basePrice: true,
              amenities: true,
            },
          },
        },
        orderBy,
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      items: items.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        city: p.city,
        address: p.address,
        description: p.description,
        star_rating: p.starRating,
        thumbnail_url: p.thumbnailUrl,
        images: p.images ?? [],
        room_types: p.roomTypes.map((rt) => ({
          id: rt.id,
          name: rt.name,
          description: rt.description,
          max_guests: rt.maxGuests,
          base_price: rt.basePrice,
          amenities: rt.amenities ?? [],
        })),
        created_at: p.createdAt.toISOString(),
      })),
      page,
      page_size: pageSize,
      total,
      has_next: skip + items.length < total,
    };
  }

  async getPropertyById(id: string) {
    const p = await this.prisma.property.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        address: true,
        description: true,
        starRating: true,
        thumbnailUrl: true,
        images: true,
        createdAt: true,
        roomTypes: {
          select: {
            id: true,
            name: true,
            description: true,
            maxGuests: true,
            basePrice: true,
            amenities: true,
            allotments: {
              where: {
                date: {
                  gte: new Date(),
                },
              },
              take: 30,
              orderBy: { date: 'asc' },
              select: {
                id: true,
                date: true,
                totalRooms: true,
                bookedRooms: true,
                price: true,
                isBlocked: true,
              },
            },
          },
        },
      },
    });

    if (!p) {
      throw new NotFoundException('Không tìm thấy khách sạn / cơ sở lưu trú');
    }

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      city: p.city,
      address: p.address,
      description: p.description,
      star_rating: p.starRating,
      thumbnail_url: p.thumbnailUrl,
      images: p.images ?? [],
      room_types: p.roomTypes.map((rt) => ({
        id: rt.id,
        name: rt.name,
        description: rt.description,
        max_guests: rt.maxGuests,
        base_price: rt.basePrice,
        amenities: rt.amenities ?? [],
        allotments: (rt.allotments ?? []).map((a) => ({
          date: a.date.toISOString().split('T')[0],
          total_rooms: a.totalRooms,
          booked_rooms: a.bookedRooms,
          available_rooms: Math.max(0, a.totalRooms - a.bookedRooms),
          price: a.price,
          is_blocked: a.isBlocked,
        })),
      })),
      created_at: p.createdAt.toISOString(),
    };
  }

  async getPropertyAllotments(
    propertyId: string,
    month?: string,
    actor?: AuthenticatedUser,
  ) {
    if (!actor) {
      throw new UnauthorizedException('Yêu cầu xác thực để xem lịch tồn kho');
    }

    resolvePropertyScope(actor, propertyId);

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        name: true,
        roomTypes: {
          select: {
            id: true,
            name: true,
            basePrice: true,
          },
        },
      },
    });

    if (!property) {
      throw new NotFoundException('Không tìm thấy khách sạn');
    }

    const roomTypeIds = property.roomTypes.map((rt) => rt.id);

    let startDate: Date;
    let endDate: Date;

    if (month !== undefined && month !== null && month !== '') {
      if (!/^\d{4}-\d{2}$/.test(month)) {
        throw new BadRequestException(
          'Tháng không hợp lệ (định dạng yêu cầu: YYYY-MM)',
        );
      }
      const [year, m] = month.split('-').map(Number);
      if (m < 1 || m > 12) {
        throw new BadRequestException('Tháng không hợp lệ (phải từ 01 đến 12)');
      }
      startDate = new Date(Date.UTC(year, m - 1, 1));
      endDate = new Date(Date.UTC(year, m, 1));
    } else {
      const now = new Date();
      startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
      endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
    }

    const allotments = await this.prisma.roomAllotment.findMany({
      where: {
        roomTypeId: { in: roomTypeIds },
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    return {
      property_id: property.id,
      property_name: property.name,
      month:
        month ??
        `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`,
      room_types: property.roomTypes.map((rt) => {
        const rtAllotments = allotments.filter((a) => a.roomTypeId === rt.id);
        return {
          id: rt.id,
          name: rt.name,
          base_price: rt.basePrice,
          total_rooms: 10,
          allotments: rtAllotments.map((a) => ({
            id: a.id,
            date:
              a.date instanceof Date
                ? a.date.toISOString().split('T')[0]
                : String(a.date).split('T')[0],
            total_rooms: a.totalRooms,
            booked_rooms: a.bookedRooms,
            available_rooms: Math.max(0, a.totalRooms - a.bookedRooms),
            price: a.price,
            is_blocked: a.isBlocked,
          })),
        };
      }),
    };
  }

  async updateAllotment(rawDto: UpdateAllotmentDto, actor?: AuthenticatedUser) {
    if (!actor) {
      throw new UnauthorizedException(
        'Yêu cầu xác thực tài khoản để cập nhật tồn kho',
      );
    }

    const parsed = updateAllotmentSchema.safeParse(rawDto);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dữ liệu cập nhật allotment không hợp lệ',
        details: parsed.error.issues,
      });
    }

    const dto = parsed.data;

    // Strict date validation
    const [y, m, d] = dto.date.split('-').map(Number);
    const targetDate = new Date(Date.UTC(y, m - 1, d));
    if (
      isNaN(targetDate.getTime()) ||
      targetDate.getUTCFullYear() !== y ||
      targetDate.getUTCMonth() !== m - 1 ||
      targetDate.getUTCDate() !== d
    ) {
      throw new BadRequestException('Ngày không hợp lệ');
    }

    const roomType = await this.prisma.roomType.findUnique({
      where: { id: dto.room_type_id },
      select: {
        id: true,
        propertyId: true,
        basePrice: true,
      },
    });
    if (!roomType) {
      throw new NotFoundException('Không tìm thấy hạng phòng');
    }

    resolvePropertyScope(actor, roomType.propertyId);

    const existing = await this.prisma.roomAllotment.findUnique({
      where: {
        roomTypeId_date: {
          roomTypeId: dto.room_type_id,
          date: targetDate,
        },
      },
    });

    if (dto.total_rooms !== undefined) {
      const currentBooked = existing ? existing.bookedRooms : 0;
      if (dto.total_rooms < currentBooked) {
        throw new BadRequestException(
          `Số lượng phòng (${dto.total_rooms}) không được nhỏ hơn số phòng đã đặt (${currentBooked})`,
        );
      }
    }

    let target = existing;
    if (!target) {
      await this.prisma.roomAllotment.createMany({
        data: {
          roomTypeId: dto.room_type_id,
          date: targetDate,
          totalRooms: dto.total_rooms ?? 10,
          bookedRooms: 0,
          price: dto.price ?? roomType.basePrice,
          isBlocked: dto.is_blocked ?? false,
        },
        skipDuplicates: true,
      });
      target = await this.prisma.roomAllotment.findUnique({
        where: {
          roomTypeId_date: {
            roomTypeId: dto.room_type_id,
            date: targetDate,
          },
        },
      });
    }

    if (!target) {
      throw new NotFoundException('Không tìm thấy lịch tồn kho vừa cập nhật');
    }

    const updateResult = await this.prisma.roomAllotment.updateMany({
      where: {
        id: target.id,
        ...(dto.total_rooms !== undefined
          ? { bookedRooms: { lte: dto.total_rooms } }
          : {}),
      },
      data: {
        ...(dto.total_rooms !== undefined
          ? { totalRooms: dto.total_rooms }
          : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.is_blocked !== undefined ? { isBlocked: dto.is_blocked } : {}),
      },
    });

    if (updateResult.count !== 1) {
      throw new BadRequestException(
        'Số lượng phòng vừa thay đổi; vui lòng tải lại lịch tồn kho',
      );
    }

    const updated: RoomAllotment | null =
      await this.prisma.roomAllotment.findUnique({
        where: { id: target.id },
      });
    if (!updated) {
      throw new NotFoundException('Không tìm thấy lịch tồn kho vừa cập nhật');
    }

    return {
      id: updated.id,
      room_type_id: updated.roomTypeId,
      date:
        updated.date instanceof Date
          ? updated.date.toISOString().split('T')[0]
          : String(updated.date).split('T')[0],
      total_rooms: updated.totalRooms,
      booked_rooms: updated.bookedRooms,
      available_rooms: Math.max(0, updated.totalRooms - updated.bookedRooms),
      price: updated.price,
      is_blocked: updated.isBlocked,
    };
  }

  async createProperty(rawDto: CreatePropertyDto) {
    const parsed = createPropertySchema.safeParse(rawDto);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dữ liệu khách sạn không hợp lệ',
        details: parsed.error.issues,
      });
    }
    const dto = parsed.data;
    const slug =
      dto.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-') +
      '-' +
      Date.now();

    const p = await this.prisma.property.create({
      data: {
        name: dto.name,
        slug,
        city: dto.city,
        address: dto.address,
        description: dto.description,
        starRating: dto.star_rating ?? 4,
        thumbnailUrl: dto.thumbnail_url,
      },
    });

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      city: p.city,
      address: p.address,
      star_rating: p.starRating,
      created_at: p.createdAt.toISOString(),
    };
  }

  async listServices(category?: string) {
    const where: Prisma.AddonServiceWhereInput = { isActive: true };
    if (category) {
      where.category = category;
    }

    const items = await this.prisma.addonService.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return items.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      price: s.price,
      description: s.description,
      is_active: s.isActive,
    }));
  }

  async createService(rawDto: CreateServiceDto) {
    const parsed = createServiceSchema.safeParse(rawDto);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dữ liệu dịch vụ không hợp lệ',
        details: parsed.error.issues,
      });
    }
    const dto = parsed.data;
    const s = await this.prisma.addonService.create({
      data: {
        name: dto.name,
        category: dto.category,
        price: dto.price,
        description: dto.description,
      },
    });

    return {
      id: s.id,
      name: s.name,
      category: s.category,
      price: s.price,
    };
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, type RoomAllotment } from '@prisma/client';
import {
  type CreatePropertyDto,
  createPropertySchema,
  type CreateRoomTypeDto,
  createRoomTypeSchema,
  type CreateServiceDto,
  createServiceSchema,
  type UpdateAllotmentDto,
  updateAllotmentSchema,
  type UpdatePropertyDto,
  updatePropertySchema,
  type UpdateRoomTypeDto,
  updateRoomTypeSchema,
} from './dto/catalog.dto';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { resolvePropertyScope } from '../../common/auth/property-scope.helper';
import { VietSageSyncService } from '../vietsage-sync/vietsage-sync.service';

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vietSageSyncService: VietSageSyncService,
  ) {}

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
          vietSageHotelId: true,
          createdAt: true,
          partnerAccounts: {
            select: {
              id: true,
              email: true,
              displayName: true,
            },
          },
          roomTypes: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              description: true,
              maxGuests: true,
              basePrice: true,
              amenities: true,
              vietSageRoomTypeId: true,
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
        vietsage_hotel_id: p.vietSageHotelId,
        partner_email: p.partnerAccounts?.[0]?.email ?? null,
        vietsage_hotel_email:
          p.vietSageHotelId && p.vietSageHotelId.includes('@')
            ? p.vietSageHotelId
            : (p.partnerAccounts?.[0]?.email ?? null),
        room_types: p.roomTypes.map((rt) => ({
          id: rt.id,
          name: rt.name,
          description: rt.description,
          max_guests: rt.maxGuests,
          base_price: rt.basePrice,
          amenities: rt.amenities ?? [],
          vietsage_room_type_id: rt.vietSageRoomTypeId,
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
        vietSageHotelId: true,
        createdAt: true,
        partnerAccounts: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
        roomTypes: {
          select: {
            id: true,
            name: true,
            description: true,
            maxGuests: true,
            basePrice: true,
            amenities: true,
            areaSqm: true,
            bedType: true,
            bedCount: true,
            hasSeaView: true,
            isActive: true,
            vietSageRoomTypeId: true,
            roomImages: true,
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
      vietsage_hotel_id: p.vietSageHotelId,
      partner_email: p.partnerAccounts?.[0]?.email ?? null,
      vietsage_hotel_email:
        p.vietSageHotelId && p.vietSageHotelId.includes('@')
          ? p.vietSageHotelId
          : (p.partnerAccounts?.[0]?.email ?? null),
      room_types: p.roomTypes.map((rt) => ({
        id: rt.id,
        name: rt.name,
        description: rt.description,
        max_guests: rt.maxGuests,
        base_price: rt.basePrice,
        area_sqm: rt.areaSqm,
        bed_type: rt.bedType,
        bed_count: rt.bedCount,
        has_sea_view: rt.hasSeaView,
        is_active: rt.isActive,
        amenities: rt.amenities ?? [],
        room_images: (rt.roomImages as string[]) ?? [],
        vietsage_room_type_id: rt.vietSageRoomTypeId,
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
        vietSageHotelId: dto.vietsage_hotel_id || null,
      },
    });

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      city: p.city,
      address: p.address,
      star_rating: p.starRating,
      vietsage_hotel_id: p.vietSageHotelId,
      created_at: p.createdAt.toISOString(),
    };
  }

  async updateProperty(
    id: string,
    rawDto: UpdatePropertyDto,
    actor: AuthenticatedUser,
  ) {
    resolvePropertyScope(actor, id);

    const parsed = updatePropertySchema.safeParse(rawDto);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dữ liệu khách sạn không hợp lệ',
        details: parsed.error.issues,
      });
    }

    const existing = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Không tìm thấy cơ sở lưu trú có id ${id}`);
    }

    const dto = parsed.data;
    const updated = await this.prisma.property.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.city !== undefined ? { city: dto.city } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.star_rating !== undefined ? { starRating: dto.star_rating } : {}),
        ...(dto.thumbnail_url !== undefined ? { thumbnailUrl: dto.thumbnail_url || null } : {}),
        ...(dto.images !== undefined ? { images: dto.images } : {}),
        ...(dto.is_active !== undefined ? { isActive: dto.is_active } : {}),
        ...(dto.vietsage_hotel_id !== undefined
          ? { vietSageHotelId: dto.vietsage_hotel_id || null }
          : {}),
      },
    });

    if (
      dto.vietsage_hotel_id !== undefined &&
      dto.vietsage_hotel_id &&
      dto.vietsage_hotel_id.includes('@')
    ) {
      await this.prisma.account.updateMany({
        where: {
          email: { equals: dto.vietsage_hotel_id.trim(), mode: 'insensitive' },
        },
        data: { managedPropertyId: id },
      });
    }

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      city: updated.city,
      address: updated.address,
      description: updated.description,
      star_rating: updated.starRating,
      thumbnail_url: updated.thumbnailUrl,
      images: updated.images,
      is_active: updated.isActive,
      vietsage_hotel_id: updated.vietSageHotelId,
      vietsage_hotel_email:
        updated.vietSageHotelId && updated.vietSageHotelId.includes('@')
          ? updated.vietSageHotelId
          : null,
      updated_at: updated.updatedAt.toISOString(),
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

  async createRoomType(rawDto: CreateRoomTypeDto, actor?: AuthenticatedUser) {
    if (!actor) {
      throw new UnauthorizedException('Yêu cầu xác thực tài khoản để tạo hạng phòng');
    }

    const parsed = createRoomTypeSchema.safeParse(rawDto);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dữ liệu hạng phòng không hợp lệ',
        details: parsed.error.issues,
      });
    }

    const dto = parsed.data;
    const scope = resolvePropertyScope(actor, dto.property_id);
    const targetPropertyId = scope.propertyId;

    if (!targetPropertyId) {
      throw new BadRequestException('Vui lòng chỉ định cơ sở lưu trú hợp lệ');
    }

    const property = await this.prisma.property.findUnique({
      where: { id: targetPropertyId },
    });
    if (!property) {
      throw new NotFoundException('Không tìm thấy cơ sở lưu trú');
    }

    const created = await this.prisma.roomType.create({
      data: {
        propertyId: targetPropertyId,
        name: dto.name,
        description: dto.description ?? null,
        maxGuests: dto.max_guests ?? 2,
        basePrice: dto.base_price,
        areaSqm: dto.area_sqm ?? null,
        bedType: dto.bed_type ?? null,
        bedCount: dto.bed_count ?? 1,
        hasSeaView: dto.has_sea_view ?? false,
        amenities: dto.amenities ?? [],
        roomImages: dto.room_images ?? [],
        isActive: dto.is_active ?? true,
        vietSageRoomTypeId: dto.vietsage_room_type_id || null,
      },
    });

    return {
      id: created.id,
      property_id: created.propertyId,
      name: created.name,
      description: created.description,
      max_guests: created.maxGuests,
      base_price: created.basePrice,
      area_sqm: created.areaSqm,
      bed_type: created.bedType,
      bed_count: created.bedCount,
      has_sea_view: created.hasSeaView,
      amenities: created.amenities ?? [],
      room_images: (created.roomImages as string[]) ?? [],
      is_active: created.isActive,
      vietsage_room_type_id: created.vietSageRoomTypeId,
      created_at: created.createdAt.toISOString(),
      updated_at: created.updatedAt.toISOString(),
    };
  }

  async updateRoomType(id: string, rawDto: UpdateRoomTypeDto, actor?: AuthenticatedUser) {
    if (!actor) {
      throw new UnauthorizedException('Yêu cầu xác thực tài khoản để cập nhật hạng phòng');
    }

    const parsed = updateRoomTypeSchema.safeParse(rawDto);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dữ liệu cập nhật hạng phòng không hợp lệ',
        details: parsed.error.issues,
      });
    }

    const existing = await this.prisma.roomType.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy hạng phòng');
    }

    resolvePropertyScope(actor, existing.propertyId);

    const dto = parsed.data;
    const updated = await this.prisma.roomType.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.max_guests !== undefined ? { maxGuests: dto.max_guests } : {}),
        ...(dto.base_price !== undefined ? { basePrice: dto.base_price } : {}),
        ...(dto.area_sqm !== undefined ? { areaSqm: dto.area_sqm } : {}),
        ...(dto.bed_type !== undefined ? { bedType: dto.bed_type } : {}),
        ...(dto.bed_count !== undefined ? { bedCount: dto.bed_count } : {}),
        ...(dto.has_sea_view !== undefined ? { hasSeaView: dto.has_sea_view } : {}),
        ...(dto.amenities !== undefined ? { amenities: dto.amenities } : {}),
        ...(dto.room_images !== undefined ? { roomImages: dto.room_images } : {}),
        ...(dto.is_active !== undefined ? { isActive: dto.is_active } : {}),
        ...(dto.vietsage_room_type_id !== undefined
          ? { vietSageRoomTypeId: dto.vietsage_room_type_id || null }
          : {}),
      },
    });

    return {
      id: updated.id,
      property_id: updated.propertyId,
      name: updated.name,
      description: updated.description,
      max_guests: updated.maxGuests,
      base_price: updated.basePrice,
      area_sqm: updated.areaSqm,
      bed_type: updated.bedType,
      bed_count: updated.bedCount,
      has_sea_view: updated.hasSeaView,
      amenities: updated.amenities ?? [],
      room_images: (updated.roomImages as string[]) ?? [],
      is_active: updated.isActive,
      vietsage_room_type_id: updated.vietSageRoomTypeId,
      created_at: updated.createdAt.toISOString(),
      updated_at: updated.updatedAt.toISOString(),
    };
  }

  async deleteRoomType(id: string, actor?: AuthenticatedUser) {
    if (!actor) {
      throw new UnauthorizedException('Yêu cầu xác thực tài khoản để xóa hạng phòng');
    }

    const existing = await this.prisma.roomType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy hạng phòng');
    }

    resolvePropertyScope(actor, existing.propertyId);

    // If there are existing bookings, soft-delete by marking inactive
    if (existing._count.bookings > 0) {
      await this.prisma.roomType.update({
        where: { id },
        data: { isActive: false },
      });
      return {
        id,
        deleted: true,
        soft_deleted: true,
        message: 'Hạng phòng đã được ngưng bán để đảm bảo toàn vẹn dữ liệu đơn đặt.',
      };
    }

    await this.prisma.roomType.delete({
      where: { id },
    });

    return {
      id,
      deleted: true,
      soft_deleted: false,
      message: 'Hạng phòng đã được xóa hoàn toàn.',
    };
  }

  /**
   * Xem trước danh mục phòng từ VietSage PMS trước khi nhập hàng loạt
   */
  async previewVietSageRooms(propertyId: string, actor: AuthenticatedUser) {
    resolvePropertyScope(actor, propertyId);

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        roomTypes: true,
        partnerAccounts: true,
      },
    });

    if (!property) {
      throw new NotFoundException(`Không tìm thấy cơ sở lưu trú có id ${propertyId}`);
    }

    const partnerEmail =
      (property.vietSageHotelId?.includes('@') ? property.vietSageHotelId : undefined) ||
      property.partnerAccounts?.[0]?.email ||
      (actor.role === 'HOTEL_PARTNER' ? actor.email : undefined) ||
      actor.email;

    const hotelIdentifier =
      property.vietSageHotelId ||
      partnerEmail ||
      property.slug ||
      property.name;

    const catalog = await this.vietSageSyncService.fetchRoomCatalog(
      hotelIdentifier,
      partnerEmail,
    );

    const existingRoomTypes = property.roomTypes;

    return {
      hotel_id: catalog.hotelId,
      hotel_name: catalog.hotelName,
      hotel_code: catalog.hotelCode,
      partner_email: catalog.partnerEmail || partnerEmail || '',
      total_pms_rooms: catalog.roomTypes.reduce((sum, r) => sum + r.totalRooms, 0),
      room_types: catalog.roomTypes.map((rt) => {
        const existing = existingRoomTypes.find(
          (e) =>
            (e.vietSageRoomTypeId && e.vietSageRoomTypeId === rt.normalizedKey) ||
            e.name.trim().toLowerCase() === rt.name.trim().toLowerCase(),
        );

        return {
          name: rt.name,
          normalized_key: rt.normalizedKey,
          description: rt.description,
          base_price: rt.basePrice,
          total_rooms: rt.totalRooms,
          max_guests: rt.maxGuests,
          bed_type: rt.bedType,
          area_sqm: rt.areaSqm,
          amenities: rt.amenities,
          sample_room_numbers: rt.sampleRoomNumbers,
          action: existing ? ('UPDATE' as const) : ('CREATE' as const),
          existing_id: existing?.id || null,
        };
      }),
    };
  }

  /**
   * Nhập hàng loạt danh mục phòng và khởi tạo tồn kho 30 ngày từ VietSage PMS
   */
  async importVietSageRooms(
    propertyId: string,
    selectedKeys?: string[],
    actor?: AuthenticatedUser,
  ) {
    if (!actor) {
      throw new UnauthorizedException('Yêu cầu xác thực tài khoản để nhập phòng');
    }

    resolvePropertyScope(actor, propertyId);

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        roomTypes: true,
        partnerAccounts: true,
      },
    });

    if (!property) {
      throw new NotFoundException(`Không tìm thấy cơ sở lưu trú có id ${propertyId}`);
    }

    const partnerEmail =
      (property.vietSageHotelId?.includes('@') ? property.vietSageHotelId : undefined) ||
      property.partnerAccounts?.[0]?.email ||
      (actor.role === 'HOTEL_PARTNER' ? actor.email : undefined) ||
      actor.email;

    const hotelIdentifier =
      property.vietSageHotelId ||
      partnerEmail ||
      property.slug ||
      property.name;

    const catalog = await this.vietSageSyncService.fetchRoomCatalog(
      hotelIdentifier,
      partnerEmail,
    );

    const filteredRooms =
      selectedKeys && selectedKeys.length > 0
        ? catalog.roomTypes.filter((rt) => selectedKeys.includes(rt.normalizedKey))
        : catalog.roomTypes;

    if (filteredRooms.length === 0) {
      throw new BadRequestException('Không có hạng phòng nào được chọn để nhập');
    }

    return await this.prisma.$transaction(async (tx) => {
      // Tự động liên kết vietSageHotelId nếu chưa có
      if (!property.vietSageHotelId && catalog.hotelId) {
        await tx.property.update({
          where: { id: propertyId },
          data: { vietSageHotelId: catalog.hotelId },
        });
      }

      let createdCount = 0;
      let updatedCount = 0;
      const processedRoomTypes: Array<{ id: string; name: string; action: string }> = [];

      // Chuẩn bị ngày tạo allotment (30 ngày tiếp theo)
      const now = new Date();
      const todayYear = now.getUTCFullYear();
      const todayMonth = now.getUTCMonth();
      const todayDate = now.getUTCDate();

      for (const rt of filteredRooms) {
        const existing = property.roomTypes.find(
          (e) =>
            (e.vietSageRoomTypeId && e.vietSageRoomTypeId === rt.normalizedKey) ||
            e.name.trim().toLowerCase() === rt.name.trim().toLowerCase(),
        );

        let targetRoomTypeId: string;
        const price = Math.round(rt.basePrice) > 0 ? Math.round(rt.basePrice) : 500000;
        const totalRooms = rt.totalRooms > 0 ? rt.totalRooms : 5;

        if (existing) {
          // Cập nhật hạng phòng hiện có
          const updated = await tx.roomType.update({
            where: { id: existing.id },
            data: {
              vietSageRoomTypeId: rt.normalizedKey,
              basePrice: price,
              maxGuests: rt.maxGuests > 0 ? rt.maxGuests : existing.maxGuests,
              bedType: rt.bedType || existing.bedType,
              areaSqm: rt.areaSqm > 0 ? rt.areaSqm : existing.areaSqm,
              amenities:
                rt.amenities && rt.amenities.length > 0
                  ? rt.amenities
                  : ((existing.amenities as Prisma.InputJsonValue) ??
                    Prisma.JsonNull),
              isActive: true,
            },
          });
          targetRoomTypeId = updated.id;
          updatedCount++;
          processedRoomTypes.push({ id: updated.id, name: updated.name, action: 'UPDATED' });
        } else {
          // Tạo mới hạng phòng
          const created = await tx.roomType.create({
            data: {
              propertyId,
              name: rt.name,
              description: rt.description || `${rt.name} - Đồng bộ tự động từ VietSage PMS`,
              maxGuests: rt.maxGuests > 0 ? rt.maxGuests : 2,
              basePrice: price,
              bedType: rt.bedType || 'DOUBLE',
              bedCount: 1,
              areaSqm: rt.areaSqm > 0 ? rt.areaSqm : 25,
              hasSeaView: false,
              amenities:
                rt.amenities && rt.amenities.length > 0
                  ? rt.amenities
                  : ['WiFi miễn phí', 'Điều hòa không khí', 'Truyền hình vệ tinh', 'Bình nước nóng'],
              vietSageRoomTypeId: rt.normalizedKey,
              isActive: true,
            },
          });
          targetRoomTypeId = created.id;
          createdCount++;
          processedRoomTypes.push({ id: created.id, name: created.name, action: 'CREATED' });
        }

        // Tạo/Cập nhật tồn kho ban đầu cho 30 ngày để phòng có thể nhận booking ngay lập tức
        for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
          const allotmentDate = new Date(Date.UTC(todayYear, todayMonth, todayDate + dayOffset));
          await tx.roomAllotment.upsert({
            where: {
              roomTypeId_date: {
                roomTypeId: targetRoomTypeId,
                date: allotmentDate,
              },
            },
            create: {
              roomTypeId: targetRoomTypeId,
              date: allotmentDate,
              totalRooms,
              bookedRooms: 0,
              price,
              isBlocked: false,
            },
            update: {
              totalRooms,
              price,
            },
          });
        }
      }

      return {
        success: true,
        property_id: propertyId,
        hotel_name: catalog.hotelName,
        hotel_code: catalog.hotelCode,
        created_count: createdCount,
        updated_count: updatedCount,
        total_processed: filteredRooms.length,
        room_types: processedRoomTypes,
      };
    });
  }
}

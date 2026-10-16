import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreatePropertyDto, CreateServiceDto } from './dto/catalog.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listProperties(filter?: { city?: string; keyword?: string; page?: number; pageSize?: number }) {
    const page = filter?.page ?? 1;
    const pageSize = filter?.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: any = { isActive: true };
    if (filter?.city) {
      where.city = { contains: filter.city, mode: 'insensitive' };
    }
    if (filter?.keyword) {
      where.OR = [
        { name: { contains: filter.keyword, mode: 'insensitive' } },
        { description: { contains: filter.keyword, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: pageSize,
        include: { roomTypes: true },
        orderBy: { createdAt: 'desc' },
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
        room_types: p.roomTypes.map((rt) => ({
          id: rt.id,
          name: rt.name,
          max_guests: rt.maxGuests,
          base_price: rt.basePrice,
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
      include: { roomTypes: true },
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
      room_types: p.roomTypes.map((rt) => ({
        id: rt.id,
        name: rt.name,
        description: rt.description,
        max_guests: rt.maxGuests,
        base_price: rt.basePrice,
      })),
      created_at: p.createdAt.toISOString(),
    };
  }

  async createProperty(dto: CreatePropertyDto) {
    const slug = dto.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-') + '-' + Date.now();

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
    const where: any = { isActive: true };
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

  async createService(dto: CreateServiceDto) {
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

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from './audit.service';
import {
  ApprovePartnerDto,
  approvePartnerSchema,
  ListUsersQueryDto,
  listUsersQuerySchema,
  UpdateUserRoleDto,
  updateUserRoleSchema,
} from './dto/auth.dto';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import type { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listUsers(
    rawQuery: ListUsersQueryDto,
    adminUser?: AuthenticatedUser,
  ) {
    const parsed = listUsersQuerySchema.safeParse(rawQuery);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Tham số tìm kiếm người dùng không hợp lệ',
        details: parsed.error.issues,
      });
    }

    const { role, search, status, page, page_size: pageSize } = parsed.data;

    const where: Prisma.AccountWhereInput = {};

    const isCallerAdmin = adminUser?.role === 'ADMIN';

    if (isCallerAdmin) {
      if (role === 'ADMIN') {
        where.role = { in: [] };
      } else if (!role || role === 'ALL') {
        where.role = { not: 'ADMIN' };
      } else {
        where.role = role;
      }
    } else if (role && role !== 'ALL') {
      where.role = role;
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { username: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { displayName: { contains: term, mode: 'insensitive' } },
        { managedProperty: { name: { contains: term, mode: 'insensitive' } } },
      ];
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    } else if (status === 'pending') {
      where.role = 'TRAVELER';
      where.managedPropertyId = { not: null };
    }

    const skip = (page - 1) * pageSize;

    const [
      items,
      total,
      totalUsers,
      totalPartners,
      totalAdmins,
      totalPending,
      totalTravelers,
    ] = await Promise.all([
        this.prisma.account.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            managedProperty: {
              select: {
                id: true,
                name: true,
                city: true,
                address: true,
                isActive: true,
              },
            },
            roleAssignments: {
              include: {
                role: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                  },
                },
              },
            },
            auditEvents: {
              where: {
                action: {
                  in: [
                    'PARTNER_REGISTRATION_SUBMITTED',
                    'PARTNER_ROLE_APPROVED',
                  ],
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        }),
        this.prisma.account.count({ where }),
        this.prisma.account.count(
          isCallerAdmin ? { where: { role: { not: 'ADMIN' } } } : undefined,
        ),
        this.prisma.account.count({ where: { role: 'HOTEL_PARTNER' } }),
        this.prisma.account.count({ where: { role: 'ADMIN' } }),
        this.prisma.account.count({
          where: { role: 'TRAVELER', managedPropertyId: { not: null } },
        }),
        this.prisma.account.count({ where: { role: 'TRAVELER' } }),
      ]);

    return {
      items: items.map((a) => {
        const registrationMeta =
          (a.auditEvents?.[0]?.metadata as Record<string, unknown>) || null;
        const isPending = a.role === 'TRAVELER' && Boolean(a.managedPropertyId);

        return {
          id: a.id,
          username: a.username,
          display_name: a.displayName,
          email: a.email,
          role: a.role,
          is_active: a.isActive,
          managed_property_id: a.managedPropertyId,
          managed_property: a.managedProperty
            ? {
                id: a.managedProperty.id,
                name: a.managedProperty.name,
                city: a.managedProperty.city,
                address: a.managedProperty.address,
                is_active: a.managedProperty.isActive,
              }
            : null,
          pending_approval: isPending,
          registration_metadata: registrationMeta,
          created_at: a.createdAt.toISOString(),
          updated_at: a.updatedAt.toISOString(),
        };
      }),
      total,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(total / pageSize) || 1,
      summary: {
        total_users: totalUsers,
        total_partners: totalPartners,
        total_admins: isCallerAdmin ? 0 : totalAdmins,
        total_pending: totalPending,
        total_travelers: totalTravelers,
      },
    };
  }

  async approvePartner(
    userId: string,
    rawDto: ApprovePartnerDto,
    adminUser: AuthenticatedUser,
  ) {
    const parsed = approvePartnerSchema.safeParse(rawDto);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dữ liệu duyệt đối tác không hợp lệ',
        details: parsed.error.issues,
      });
    }

    const account = await this.prisma.account.findUnique({
      where: { id: userId },
      include: { managedProperty: true },
    });

    if (!account) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng');
    }

    if (account.role === 'ADMIN') {
      throw new BadRequestException(
        'Không thể phê duyệt đối tác cho tài khoản Quản trị viên (ADMIN)',
      );
    }

    const partnerRole = await this.prisma.role.findUnique({
      where: { code: 'HOTEL_PARTNER' },
    });

    if (!partnerRole) {
      throw new BadRequestException(
        'Vai trò HOTEL_PARTNER chưa được khởi tạo trong hệ thống',
      );
    }

    const targetPropertyId =
      parsed.data.managed_property_id || account.managedPropertyId;

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Assign HOTEL_PARTNER role assignment
      await tx.accountRoleAssignment.upsert({
        where: {
          accountId_roleId: {
            accountId: userId,
            roleId: partnerRole.id,
          },
        },
        create: {
          accountId: userId,
          roleId: partnerRole.id,
        },
        update: {},
      });

      // 2. Remove any other roles if needed
      const adminRole = await tx.role.findUnique({ where: { code: 'ADMIN' } });
      if (adminRole) {
        await tx.accountRoleAssignment.deleteMany({
          where: {
            accountId: userId,
            roleId: adminRole.id,
          },
        });
      }

      // 3. Update account record
      const acc = await tx.account.update({
        where: { id: userId },
        data: {
          role: 'HOTEL_PARTNER',
          isActive: parsed.data.is_active ?? true,
          managedPropertyId: targetPropertyId,
        },
        include: {
          managedProperty: true,
        },
      });

      // 4. Activate target property if assigned
      if (targetPropertyId) {
        await tx.property.update({
          where: { id: targetPropertyId },
          data: { isActive: true },
        });
      }

      // 5. Log audit event
      await tx.auditEvent.create({
        data: {
          actorId: adminUser.id,
          action: 'PARTNER_ROLE_APPROVED',
          boundedContext: 'identity-access',
          resourceType: 'Account',
          resourceId: userId,
          metadata: {
            approvedBy: adminUser.username,
            assignedRole: 'HOTEL_PARTNER',
            propertyId: targetPropertyId,
          },
        },
      });

      return acc;
    });

    return {
      id: updated.id,
      username: updated.username,
      display_name: updated.displayName,
      email: updated.email,
      role: updated.role,
      is_active: updated.isActive,
      managed_property_id: updated.managedPropertyId,
      managed_property: updated.managedProperty
        ? {
            id: updated.managedProperty.id,
            name: updated.managedProperty.name,
            city: updated.managedProperty.city,
            address: updated.managedProperty.address,
            is_active: true,
          }
        : null,
      updated_at: updated.updatedAt.toISOString(),
      message: 'Đã duyệt vai trò Đối tác khách sạn (HOTEL_PARTNER) thành công',
    };
  }

  async updateUserRole(
    userId: string,
    rawDto: UpdateUserRoleDto,
    adminUser: AuthenticatedUser,
  ) {
    const parsed = updateUserRoleSchema.safeParse(rawDto);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dữ liệu thay đổi vai trò không hợp lệ',
        details: parsed.error.issues,
      });
    }

    if (adminUser.id === userId && parsed.data.role !== 'ADMIN') {
      throw new BadRequestException(
        'Không thể tự hạ quyền vai trò Quản trị viên của chính mình',
      );
    }

    if (adminUser.id === userId && parsed.data.is_active === false) {
      throw new BadRequestException(
        'Không thể tự khóa tài khoản quản trị của chính mình',
      );
    }

    const account = await this.prisma.account.findUnique({
      where: { id: userId },
    });

    if (!account) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng');
    }

    // STRICT PEER-ISOLATION: Block any action/modification on peer admin accounts
    if (adminUser.role === 'ADMIN' && account.role === 'ADMIN') {
      throw new BadRequestException(
        'Không thể thao tác hoặc thay đổi vai trò trên tài khoản cùng cấp Quản trị viên (ADMIN)',
      );
    }

    if (adminUser.role && account.role === adminUser.role) {
      throw new BadRequestException(
        'Không có quyền thao tác trên tài khoản cùng cấp',
      );
    }

    const { role, managed_property_id, is_active } = parsed.data;

    const updated = await this.prisma.$transaction(async (tx) => {
      // Synchronize role assignments
      if (role === 'ADMIN') {
        const adminRole = await tx.role.findUnique({ where: { code: 'ADMIN' } });
        if (adminRole) {
          await tx.accountRoleAssignment.upsert({
            where: {
              accountId_roleId: {
                accountId: userId,
                roleId: adminRole.id,
              },
            },
            create: {
              accountId: userId,
              roleId: adminRole.id,
            },
            update: {},
          });
        }
        const partnerRole = await tx.role.findUnique({
          where: { code: 'HOTEL_PARTNER' },
        });
        if (partnerRole) {
          await tx.accountRoleAssignment.deleteMany({
            where: {
              accountId: userId,
              roleId: partnerRole.id,
            },
          });
        }
      } else if (role === 'HOTEL_PARTNER') {
        const partnerRole = await tx.role.findUnique({
          where: { code: 'HOTEL_PARTNER' },
        });
        if (partnerRole) {
          await tx.accountRoleAssignment.upsert({
            where: {
              accountId_roleId: {
                accountId: userId,
                roleId: partnerRole.id,
              },
            },
            create: {
              accountId: userId,
              roleId: partnerRole.id,
            },
            update: {},
          });
        }
        const adminRole = await tx.role.findUnique({ where: { code: 'ADMIN' } });
        if (adminRole) {
          await tx.accountRoleAssignment.deleteMany({
            where: {
              accountId: userId,
              roleId: adminRole.id,
            },
          });
        }

        if (managed_property_id) {
          await tx.property.update({
            where: { id: managed_property_id },
            data: { isActive: true },
          });
        }
      } else if (role === 'TRAVELER') {
        await tx.accountRoleAssignment.deleteMany({
          where: { accountId: userId },
        });
      }

      const acc = await tx.account.update({
        where: { id: userId },
        data: {
          role,
          ...(managed_property_id !== undefined
            ? { managedPropertyId: managed_property_id }
            : {}),
          ...(is_active !== undefined ? { isActive: is_active } : {}),
        },
        include: {
          managedProperty: true,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorId: adminUser.id,
          action: 'USER_ROLE_UPDATED',
          boundedContext: 'identity-access',
          resourceType: 'Account',
          resourceId: userId,
          metadata: {
            updatedBy: adminUser.username,
            newRole: role,
            propertyId: managed_property_id ?? null,
            isActive: is_active ?? null,
          },
        },
      });

      return acc;
    });

    return {
      id: updated.id,
      username: updated.username,
      display_name: updated.displayName,
      email: updated.email,
      role: updated.role,
      is_active: updated.isActive,
      managed_property_id: updated.managedPropertyId,
      managed_property: updated.managedProperty
        ? {
            id: updated.managedProperty.id,
            name: updated.managedProperty.name,
            city: updated.managedProperty.city,
            address: updated.managedProperty.address,
            is_active: updated.managedProperty.isActive,
          }
        : null,
      updated_at: updated.updatedAt.toISOString(),
      message: 'Cập nhật vai trò người dùng thành công',
    };
  }
}

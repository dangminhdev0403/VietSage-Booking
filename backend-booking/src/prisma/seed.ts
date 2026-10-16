import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial Booking Manager OTA data...');

  // 1. Roles
  const roles = [
    { code: 'SUPER_ADMIN', name: 'Super Administrator', isSystem: true },
    { code: 'ADMIN', name: 'Platform Administrator', isSystem: true },
    { code: 'HOTEL_PARTNER', name: 'Hotel & Property Partner', isSystem: true },
    { code: 'TRAVELER', name: 'Registered Traveler', isSystem: true },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { code: r.code },
      update: {},
      create: r,
    });
  }

  // 2. Super Admin Account
  const passwordHash = await bcrypt.hash('Admin@123456', 10);
  const superAdmin = await prisma.account.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      displayName: 'VietSage OTA SuperAdmin',
      email: 'admin@vietsage-ota.vn',
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  });

  const superAdminRole = await prisma.role.findUnique({ where: { code: 'SUPER_ADMIN' } });
  if (superAdminRole) {
    await prisma.accountRoleAssignment.upsert({
      where: {
        accountId_roleId: {
          accountId: superAdmin.id,
          roleId: superAdminRole.id,
        },
      },
      update: {},
      create: {
        accountId: superAdmin.id,
        roleId: superAdminRole.id,
      },
    });
  }

  // 3. Sample Properties
  const prop1 = await prisma.property.upsert({
    where: { slug: 'vietsage-heritage-hanoi' },
    update: {},
    create: {
      name: 'VietSage Heritage Boutique Hotel',
      slug: 'vietsage-heritage-hanoi',
      city: 'Hà Nội',
      address: '12 Phố Cổ, Hoàn Kiếm, Hà Nội',
      description: 'Khách sạn phong cách di sản boutique sang trọng giữa lòng phố cổ Hà Nội, đầy đủ tiện nghi cao cấp.',
      starRating: 5.0,
      thumbnailUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    },
  });

  const prop2 = await prisma.property.upsert({
    where: { slug: 'vietsage-eco-resort-dalat' },
    update: {},
    create: {
      name: 'VietSage Pine Forest Resort & Spa',
      slug: 'vietsage-eco-resort-dalat',
      city: 'Đà Lạt',
      address: 'Đường Hoa Hồng, Khu Hồ Tuyền Lâm, Đà Lạt',
      description: 'Khu nghỉ dưỡng sinh thái cao cấp ẩn mình giữa đồi thông xanh ngát và sương mờ lãng mạn.',
      starRating: 4.8,
      thumbnailUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
    },
  });

  // 4. Sample Room Types
  const room1 = await prisma.roomType.create({
    data: {
      propertyId: prop1.id,
      name: 'Deluxe Heritage King Room',
      description: 'Phòng King ban công nhìn ra phố cổ, bồn tắm gỗ hoàng đàn, bữa sáng thượng hạng.',
      maxGuests: 2,
      basePrice: 1850000,
    },
  });

  const room2 = await prisma.roomType.create({
    data: {
      propertyId: prop2.id,
      name: 'Pine View Luxury Bungalow',
      description: 'Bungalow biệt lập view thung lũng thông, lò sưởi ấm cúng và bồn tắm sục khoáng nóng.',
      maxGuests: 2,
      basePrice: 2450000,
    },
  });

  // 5. Sample Addon Services
  const services = [
    { name: 'Đưa đón sân bay riêng (Xe VIP)', category: 'airport_transfer', price: 450000, description: 'Đón tiễn chu đáo, tài xế chuyên nghiệp đón tại cổng ga đến.' },
    { name: 'Buffet sáng quốc tế thượng hạng', category: 'breakfast', price: 280000, description: 'Thưởng thức ẩm thực fusion Á - Âu với nguyên liệu hữu cơ tươi mới.' },
    { name: 'Gói trị liệu Spa Thảo Mộc Bản Địa (90 phút)', category: 'spa', price: 850000, description: 'Massage bấm huyệt kết hợp thảo dược quý giúp thư giãn tuyệt đối.' },
    { name: 'Tour trải nghiệm văn hóa & ẩm thực phố cổ', category: 'tour', price: 650000, description: 'Khám phá những nét đẹp ẩn giấu và món ngon truyền thống cùng hướng dẫn viên bản địa.' },
  ];

  for (const s of services) {
    await prisma.addonService.create({ data: s });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

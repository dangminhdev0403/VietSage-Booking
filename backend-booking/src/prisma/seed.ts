import { PrismaClient } from '@prisma/client';
import type { Property, RoomType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log(
    'Seeding rich Booking Manager OTA data (5 Destinations, Allotments, Partners)...',
  );

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

  const defaultPassword = await bcrypt.hash('Admin@123456', 10);

  // 2. Sample Properties with 5 Iconic Destinations
  const propertiesData = [
    {
      name: 'Aurum Heritage Grand Hotel & Spa',
      slug: 'aurum-heritage-hanoi',
      city: 'Hà Nội',
      address: '12 Phố Cổ, Phường Hàng Gai, Hoàn Kiếm, Hà Nội',
      description:
        'Khách sạn phong cách di sản Indochine quý phái ngay trung tâm phố cổ Hà Nội, kiến trúc tráng lệ pha trộn tinh hoa truyền thống và tiện nghi 5 sao thượng lưu.',
      starRating: 5.0,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
      ],
      roomTypes: [
        {
          name: 'Classic Heritage Deluxe Suite',
          description:
            'Phòng King ban công nhìn ra phố cổ, sàn gỗ tếch cổ điển, bồn tắm sứ thủ công Pháp và bữa sáng buffet tại phòng.',
          maxGuests: 2,
          basePrice: 2450000,
          amenities: [
            'Ban công phố cổ',
            'Bồn tắm freestanding',
            'Máy pha cà phê Nespresso',
            'Wifi 6 tốc độ cao',
            'Dịch vụ dọn phòng 2 lần/ngày',
          ],
        },
        {
          name: 'The Royal Presidential Indochine Suite',
          description:
            'Căn hộ tổng thống 120m² view toàn cảnh Hồ Gươm, phòng khách riêng biệt với đàn piano Steinway và quản gia 24/7.',
          maxGuests: 4,
          basePrice: 8900000,
          amenities: [
            'View Hồ Gươm 360',
            'Quản gia riêng',
            'Quầy bar thượng hạng',
            'Xe đưa đón Maybach',
            'Phòng xông hơi riêng',
          ],
        },
      ],
    },
    {
      name: 'Sapa Cloud Sanctuary Mountain Resort',
      slug: 'sapa-cloud-sanctuary',
      city: 'Sapa',
      address: 'Đồi Hoàng Liên, Mường Hoa, Thị Xã Sa Pa, Lào Cai',
      description:
        'Khu nghỉ dưỡng đỉnh đèo sương mù ôm trọn thung lũng Mường Hoa, kiến trúc ruộng bậc thang độc bản kết hợp đá tự nhiên và gỗ thông tuyết Pơ-mu.',
      starRating: 4.9,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      ],
      roomTypes: [
        {
          name: 'Valley Cloud Terrace Chalet',
          description:
            'Bungalow gỗ thông tuyết với ban công treo giữa biển mây, lò sưởi đốt củi ấm cúng và bồn sục nước nóng khoáng thiên nhiên.',
          maxGuests: 2,
          basePrice: 3200000,
          amenities: [
            'View biển mây',
            'Lò sưởi củi',
            'Bồn tắm khoáng nóng thảo mộc',
            'Sưởi sàn ấm áp',
          ],
        },
        {
          name: 'Panoramic Terraces Family Villa',
          description:
            'Biệt thự 2 tầng bằng đá núi nguyên khối, sân tắm nắng riêng tư nhìn thẳng đỉnh Fansipan huyền thoại.',
          maxGuests: 4,
          basePrice: 6500000,
          amenities: [
            'View đỉnh Fansipan',
            'Sân tắm nắng riêng',
            'Bếp nướng ngoài trời BBQ',
            'Dịch vụ đốt lửa trại',
          ],
        },
      ],
    },
    {
      name: 'Aurum Azure Coastal Reserve Da Nang',
      slug: 'aurum-azure-danang',
      city: 'Đà Nẵng',
      address: 'Võ Nguyên Giáp, Bãi biển Non Nước, Ngũ Hành Sơn, Đà Nẵng',
      description:
        'Ốc đảo ven biển thanh bình với bãi cát trắng mịn riêng tư, hồ bơi nước mặn vô cực dài 100m vươn ra biển Đông cùng ẩm thực sao Michelin.',
      starRating: 5.0,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
      ],
      roomTypes: [
        {
          name: 'Oceanfront Pavilion Pool Villa',
          description:
            'Biệt thự trước biển có hồ bơi riêng biệt, sàn gỗ teak tự nhiên và lối đi thẳng ra bờ cát trắng mịn.',
          maxGuests: 2,
          basePrice: 5800000,
          amenities: [
            'Hồ bơi riêng',
            'Lối đi bãi biển',
            'Bồn tắm ngoài trời',
            'Bữa sáng lơ lửng trên nước',
          ],
        },
        {
          name: 'Grand Sea Horizon Executive Suite',
          description:
            'Căn hộ góc tầng cao view biển Mỹ Khê và Bán Đảo Sơn Trà, giường King size lông vũ cao cấp.',
          maxGuests: 3,
          basePrice: 3800000,
          amenities: [
            'Ban công góc 180 độ',
            'Hệ thống âm thanh Bang & Olufsen',
            'Rượu vang chào mừng',
          ],
        },
      ],
    },
    {
      name: 'VietSage Pine Forest Resort & Spa',
      slug: 'vietsage-eco-resort-dalat',
      city: 'Đà Lạt',
      address: 'Đường Hoa Hồng, Khu Du Lịch Hồ Tuyền Lâm, Đà Lạt',
      description:
        'Khu nghỉ dưỡng sinh thái cao cấp ẩn mình giữa rừng thông bạt ngàn và mặt nước hồ Tuyền Lâm phẳng lặng, nơi tĩnh dưỡng tâm hồn tuyệt hảo.',
      starRating: 4.8,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
      ],
      roomTypes: [
        {
          name: 'Pine Valley Luxury Bungalow',
          description:
            'Bungalow biệt lập nép mình dưới rặng thông ngát hương, hiên trà nhìn ra mặt hồ sương sớm tĩnh mịch.',
          maxGuests: 2,
          basePrice: 2450000,
          amenities: [
            'Hiên trà ngắm hồ',
            'Tinh dầu thông xông phòng',
            'Xe đạp địa hình miễn phí',
          ],
        },
      ],
    },
    {
      name: 'Aurum Serene Haven Reserve & Villas',
      slug: 'vietsage-serene-phuquoc',
      city: 'Phú Quốc',
      address: 'Bãi Dài, Xã Gành Dầu, Đặc khu Phú Quốc, Kiên Giang',
      description:
        'Khu bảo tồn nghỉ dưỡng thượng đỉnh biệt lập hoàn toàn, sở hữu dải hoàng hôn đẹp nhất đảo ngọc cùng dịch vụ trợ lý cá nhân tinh hoa.',
      starRating: 5.0,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
      ],
      roomTypes: [
        {
          name: 'Oceanfront Sunset Luxury Villa',
          description:
            'Biệt thự hướng biển có hồ bơi vô cực riêng, phòng khách view panorama hoàng hôn và quản gia tận tâm chu đáo.',
          maxGuests: 4,
          basePrice: 14500000,
          amenities: [
            'Hồ bơi vô cực ngắm hoàng hôn',
            'Đầu bếp riêng tại biệt thự',
            'Du thuyền đưa đón',
            'Liệu trình spa không giới hạn',
          ],
        },
      ],
    },
  ];

  const createdProperties: Property[] = [];
  const createdRoomTypes: RoomType[] = [];

  for (const pData of propertiesData) {
    const { roomTypes, ...propInfo } = pData;
    const property = await prisma.property.upsert({
      where: { slug: propInfo.slug },
      update: {
        name: propInfo.name,
        city: propInfo.city,
        address: propInfo.address,
        description: propInfo.description,
        starRating: propInfo.starRating,
        thumbnailUrl: propInfo.thumbnailUrl,
        images: propInfo.images,
      },
      create: {
        ...propInfo,
      },
    });

    createdProperties.push(property);

    for (const rt of roomTypes) {
      let roomType = await prisma.roomType.findFirst({
        where: { propertyId: property.id, name: rt.name },
      });

      if (!roomType) {
        roomType = await prisma.roomType.create({
          data: {
            propertyId: property.id,
            name: rt.name,
            description: rt.description,
            maxGuests: rt.maxGuests,
            basePrice: rt.basePrice,
            amenities: rt.amenities,
          },
        });
      }

      createdRoomTypes.push(roomType);
    }
  }

  // 3. Generate 90 days of RoomAllotment inventory
  console.log('Generating 90 days of room allotments...');
  const today = new Date();
  for (const rt of createdRoomTypes) {
    for (let i = 0; i < 90; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateOnly = new Date(
        Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
      );

      // Weekend pricing surge (+15%)
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const rateMultiplier = isWeekend ? 1.15 : 1.0;
      const price = Math.round(rt.basePrice * rateMultiplier);

      await prisma.roomAllotment.upsert({
        where: {
          roomTypeId_date: {
            roomTypeId: rt.id,
            date: dateOnly,
          },
        },
        update: {
          price,
        },
        create: {
          roomTypeId: rt.id,
          date: dateOnly,
          totalRooms: 10,
          bookedRooms: i % 7 === 0 ? 3 : 1, // simulated booked rooms
          price,
          isBlocked: false,
        },
      });
    }
  }

  // 4. Accounts: SuperAdmin, Admin, Hotel Partner, Traveler
  await prisma.account.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      displayName: 'VietSage OTA SuperAdmin',
      email: 'admin@vietsage-ota.vn',
      passwordHash: defaultPassword,
      role: 'SUPER_ADMIN',
    },
  });

  await prisma.account.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      displayName: 'VietSage Platform Admin',
      email: 'platform.admin@vietsage-ota.vn',
      passwordHash: defaultPassword,
      role: 'ADMIN',
    },
  });

  await prisma.account.upsert({
    where: { username: 'partner_hanoi' },
    update: {
      managedPropertyId: createdProperties[0].id,
    },
    create: {
      username: 'partner_hanoi',
      displayName: 'Giám Đốc Vận Hành Aurum Hà Nội',
      email: 'partner.hanoi@aurumhaven.vn',
      passwordHash: defaultPassword,
      role: 'HOTEL_PARTNER',
      managedPropertyId: createdProperties[0].id,
    },
  });

  await prisma.account.upsert({
    where: { username: 'traveler_elite' },
    update: {},
    create: {
      username: 'traveler_elite',
      displayName: 'Doanh Nhân Đặng Minh',
      email: 'dangminh.vip@gmail.com',
      passwordHash: defaultPassword,
      role: 'TRAVELER',
    },
  });

  // 5. Addon Services
  const services = [
    {
      name: 'Đưa đón sân bay hạng sang (Mercedes Maybach)',
      category: 'airport_transfer',
      price: 950000,
      description:
        'Đón tiễn VIP riêng tư, nước hoa bưởi mát lành và tài xế riêng chuẩn phong thái 5 sao.',
    },
    {
      name: 'Buffet sáng quốc tế thượng hạng Imperial Cuisine',
      category: 'breakfast',
      price: 350000,
      description:
        'Thưởng thức ẩm thực fusion Á - Âu đỉnh cao với hải sản tươi sống và nguyên liệu hữu cơ cao cấp.',
    },
    {
      name: 'Gói trị liệu Spa Thảo Mộc Cung Đình (90 phút)',
      category: 'spa',
      price: 1200000,
      description:
        'Massage bấm huyệt kết hợp đá nóng bazan và tinh dầu hoa sen cung đình giúp tái tạo năng lượng.',
    },
    {
      name: 'Tour du thuyền ngắm hoàng hôn riêng tư',
      category: 'tour',
      price: 2800000,
      description:
        'Hành trình lãng mạn ngắm hoàng hôn với rượu Champagne Moët & Chandon và đĩa canapé thịnh soạn.',
    },
  ];

  for (const s of services) {
    const existing = await prisma.addonService.findFirst({
      where: { name: s.name },
    });
    if (!existing) {
      await prisma.addonService.create({ data: s });
    }
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

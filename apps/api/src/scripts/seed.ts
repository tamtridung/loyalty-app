import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/merchantAuth';

async function main() {
  const shop = await prisma.shop.upsert({
    where: { id: 'demo-shop' },
    update: {},
    create: {
      id: 'demo-shop',
      name: 'Demo Cafe',
      timezone: 'UTC',
      status: 'active',
      defaultAwardPoints: 1,
      awardPresets: [2, 3, 5],
      dailyAwardLimitPerCustomer: 3,
    },
  });

  const passwordHash = await hashPassword('password');
  const staff = await prisma.staffUser.upsert({
    where: {
      shopId_usernameOrEmail: {
        shopId: shop.id,
        usernameOrEmail: 'staff@demo.local',
      },
    },
    update: {},
    create: {
      shopId: shop.id,
      usernameOrEmail: 'staff@demo.local',
      passwordHash,
      displayName: 'Demo Staff',
      role: 'staff',
      status: 'active',
    },
  });

  console.log('Seeded shop:', shop);
  console.log('Seeded staff user:', { id: staff.id, usernameOrEmail: staff.usernameOrEmail });
  console.log('Merchant login password: password');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });

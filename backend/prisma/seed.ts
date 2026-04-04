import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Create Branch
  const branch = await prisma.branch.upsert({
    where: { id: 'main-branch' },
    update: {},
    create: {
      id: 'main-branch',
      name: 'Main Cafe Branch',
      location: 'Downtown',
      enableCash: true,
      enableDigital: true,
      enableUPI: true,
      upiId: '123@ybl'
    }
  });

  // 2. Create Admin User
  const hashedPassword = await bcrypt.hash('admin', 10);
  await prisma.user.upsert({
    where: { email: 'admin@cafe.com' },
    update: {},
    create: {
      name: 'Alex',
      email: 'admin@cafe.com',
      password: hashedPassword,
      role: 'ADMIN',
      branchId: branch.id
    }
  });

  // 3. Create Categories
  const coffee = await prisma.category.upsert({
    where: { id: 'cat-coffee' },
    update: {},
    create: { id: 'cat-coffee', name: 'Coffee', icon: 'coffee', sendToKitchen: true }
  });
  const snacks = await prisma.category.upsert({
    where: { id: 'cat-snacks' },
    update: {},
    create: { id: 'cat-snacks', name: 'Snacks', icon: 'cookie', sendToKitchen: true }
  });

  // 4. Create Products
  await prisma.product.upsert({
    where: { id: 'prod-espresso' },
    update: {},
    create: {
      id: 'prod-espresso',
      name: 'Espresso',
      price: 120,
      unit: 'cup',
      tax: 5.0,
      categoryId: coffee.id,
      branchId: branch.id
    }
  });

  await prisma.product.upsert({
    where: { id: 'prod-latte' },
    update: {},
    create: {
      id: 'prod-latte',
      name: 'Oat Milk Latte',
      price: 180,
      unit: 'cup',
      tax: 5.0,
      categoryId: coffee.id,
      branchId: branch.id
    }
  });

  // 5. Clean start for Floors
  await prisma.table.deleteMany({});
  await prisma.floor.deleteMany({});

  // 6. Create Ground Floor
  const groundFloor = await prisma.floor.create({
    data: { id: 'floor-ground', name: 'Ground Floor', branchId: branch.id }
  });

  await prisma.table.createMany({
    data: [
      { tableNumber: 1, seats: 2, floorId: groundFloor.id },
      { tableNumber: 2, seats: 4, floorId: groundFloor.id },
      { tableNumber: 3, seats: 4, floorId: groundFloor.id },
      { tableNumber: 4, seats: 2, floorId: groundFloor.id },
      { tableNumber: 5, seats: 6, floorId: groundFloor.id },
      { tableNumber: 6, seats: 4, floorId: groundFloor.id },
    ]
  });

  // 7. Create First Floor
  const firstFloor = await prisma.floor.create({
    data: { id: 'floor-first', name: '1st Floor', branchId: branch.id }
  });

  await prisma.table.createMany({
    data: [
      { tableNumber: 7, seats: 2, floorId: firstFloor.id },
      { tableNumber: 8, seats: 4, floorId: firstFloor.id },
      { tableNumber: 9, seats: 4, floorId: firstFloor.id },
      { tableNumber: 10, seats: 2, floorId: firstFloor.id },
      { tableNumber: 11, seats: 6, floorId: firstFloor.id },
      { tableNumber: 12, seats: 4, floorId: firstFloor.id },
    ]
  });

  console.log('Successfully cleaned up floors and seeded Ground + 1st Floor!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 REVERTING_TO_ICONS_SEEDING...');

  // 1. Ensure Branch
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

  // 2. Ensure Admin
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

  // 3. Find or Create Categories
  let coffee = await prisma.category.findFirst({ where: { name: { equals: 'Coffee', mode: 'insensitive' } } });
  if (!coffee) {
    coffee = await prisma.category.create({
      data: { id: 'cat-coffee', name: 'Coffee', icon: 'coffee', sendToKitchen: true }
    });
  }

  let snacks = await prisma.category.findFirst({ where: { name: { equals: 'Snacks', mode: 'insensitive' } } });
  if (!snacks) {
    snacks = await prisma.category.create({
      data: { id: 'cat-snacks', name: 'Snacks', icon: 'cookie', sendToKitchen: true }
    });
  }

  // 4. Products without images (Icons only)
  const coffeeItems = [
    { id: 'prod-espresso', name: 'Espresso', price: 120 },
    { id: 'prod-latte', name: 'Latte', price: 180 },
    { id: 'prod-doppio', name: 'Doppio', price: 150 },
    { id: 'prod-ristretto', name: 'Ristretto', price: 110 },
    { id: 'prod-lungo', name: 'Lungo', price: 130 },
    { id: 'prod-americano', name: 'Americano', price: 140 },
    { id: 'prod-flatwhite', name: 'Flat White', price: 190 },
    { id: 'prod-macchiato', name: 'Macchiato', price: 160 },
    { id: 'prod-cappuccino', name: 'Cappuccino', price: 175 },
    { id: 'prod-mocha', name: 'Cafe Mocha', price: 210 },
  ];

  for (const item of coffeeItems) {
    await prisma.product.upsert({
      where: { id: item.id },
      update: { name: item.name, price: item.price, imageUrl: null, categoryId: coffee.id },
      create: { id: item.id, name: item.name, price: item.price, unit: 'cup', tax: 5.0, imageUrl: null, categoryId: coffee.id, branchId: branch.id }
    });
  }

  const snackItems = [
    { id: 'prod-croissant', name: 'Butter Croissant', price: 140 },
    { id: 'prod-muffin', name: 'Blueberry Muffin', price: 120 },
    { id: 'prod-sandwich', name: 'Avocado Toast', price: 280 },
  ];

  for (const item of snackItems) {
    await prisma.product.upsert({
      where: { id: item.id },
      update: { name: item.name, price: item.price, imageUrl: null, categoryId: snacks.id },
      create: { id: item.id, name: item.name, price: item.price, unit: 'piece', tax: 5.0, imageUrl: null, categoryId: snacks.id, branchId: branch.id }
    });
  }

  console.log('✅ REVERT_SUCCESSFUL: Generic icons restored.');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());

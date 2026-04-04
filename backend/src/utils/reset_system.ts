import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function reset() {
  console.log('🧹 CLEANING_SYSTEM...');
  await prisma.payment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.table.updateMany({
    data: { status: 'FREE' }
  });
  console.log('✅ SYSTEM_RESET_SUCCESSFUL');
}

reset()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());

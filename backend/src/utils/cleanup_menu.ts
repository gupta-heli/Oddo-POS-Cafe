import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deepCleanup() {
  console.log('🧹 STARTING_AGGRESSIVE_MENU_CLEANUP...');

  // 1. MERGE DUPLICATE CATEGORIES
  const categories = await prisma.category.findMany({});
  const categoryMap = new Map<string, string>(); // Name -> Primary ID

  for (const cat of categories) {
    const name = cat.name.trim().toLowerCase();
    if (!categoryMap.has(name)) {
      categoryMap.set(name, cat.id);
    } else {
      const primaryId = categoryMap.get(name)!;
      console.log(`Merging Category ${cat.id} -> ${primaryId} (${cat.name})`);
      await prisma.product.updateMany({
        where: { categoryId: cat.id },
        data: { categoryId: primaryId }
      });
      await prisma.category.delete({ where: { id: cat.id } });
    }
  }

  // 2. REMOVE DUPLICATE PRODUCTS WITHIN CATEGORIES
  // We identify duplicates by Name and BranchId
  const products = await prisma.product.findMany({
    orderBy: { id: 'asc' }
  });

  const productSet = new Set<string>();
  const toDelete: string[] = [];

  for (const prod of products) {
    const key = `${prod.name.trim().toLowerCase()}-${prod.branchId}`;
    if (!productSet.has(key)) {
      productSet.add(key);
    } else {
      console.log(`Marking Duplicate Product for deletion: ${prod.name} (${prod.id})`);
      toDelete.push(prod.id);
    }
  }

  if (toDelete.length > 0) {
    // Before deleting products, we must delete their OrderItems and Variants to satisfy foreign keys
    await prisma.orderItem.deleteMany({ where: { productId: { in: toDelete } } });
    await prisma.variant.deleteMany({ where: { productId: { in: toDelete } } });
    await prisma.product.deleteMany({ where: { id: { in: toDelete } } });
  }

  console.log(`✅ CLEANUP_COMPLETE: Removed ${toDelete.length} duplicate products.`);
}

deepCleanup()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function aggressiveCleanup() {
  console.log('🧹 AGGRESSIVE_MENU_CONSOLIDATION_STARTING...');

  // 1. Find all categories and identify duplicates by name
  const allCategories = await prisma.category.findMany();
  const categoryGroups: Record<string, string[]> = {};

  for (const cat of allCategories) {
    const name = cat.name.trim().toLowerCase();
    if (!categoryGroups[name]) categoryGroups[name] = [];
    categoryGroups[name].push(cat.id);
  }

  // 2. Merge duplicate categories
  for (const [name, ids] of Object.entries(categoryGroups)) {
    if (ids.length > 1) {
      const primaryId = ids[0];
      const duplicates = ids.slice(1);
      
      console.log(`Merging ${duplicates.length} duplicate(s) for category: "${name}" -> Primary: ${primaryId}`);
      
      // Move all products from duplicates to primary
      await prisma.product.updateMany({
        where: { categoryId: { in: duplicates } },
        data: { categoryId: primaryId }
      });

      // Delete the duplicate categories
      await prisma.category.deleteMany({
        where: { id: { in: duplicates } }
      });
    }
  }

  // 3. Find all products and identify duplicates within the same branch
  const allProducts = await prisma.product.findMany();
  const productGroups: Record<string, string[]> = {};

  for (const prod of allProducts) {
    const key = `${prod.name.trim().toLowerCase()}-${prod.branchId}`;
    if (!productGroups[key]) productGroups[key] = [];
    productGroups[key].push(prod.id);
  }

  // 4. Remove duplicate products (keep the first one)
  let removedCount = 0;
  for (const [key, ids] of Object.entries(productGroups)) {
    if (ids.length > 1) {
      const duplicates = ids.slice(1);
      removedCount += duplicates.length;
      
      // Satisfy foreign keys before deletion
      await prisma.variant.deleteMany({ where: { productId: { in: duplicates } } });
      await prisma.orderItem.deleteMany({ where: { productId: { in: duplicates } } });
      
      await prisma.product.deleteMany({
        where: { id: { in: duplicates } }
      });
    }
  }

  console.log(`✅ CLEANUP_COMPLETE: Merged duplicate categories and removed ${removedCount} duplicate products.`);
}

aggressiveCleanup()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());

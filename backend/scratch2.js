import { prisma } from './src/config/db.js';

async function main() {
  const categories = await prisma.category.findMany();
  console.log("All Categories from DB:", categories);
  const products = await prisma.product.findMany({ include: { category: true } });
  console.log("All Products from DB:", products.map(p => ({ id: p.id, name: p.name, categoryId: p.categoryId, categoryName: p.category?.name })));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

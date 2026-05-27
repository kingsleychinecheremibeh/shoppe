const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();
  console.log("All Categories:", categories);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

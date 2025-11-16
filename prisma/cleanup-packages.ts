import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Cleaning up old packages...\n');

  // Delete all packages
  const deleted = await prisma.package.deleteMany({});

  console.log(`✅ Deleted ${deleted.count} packages\n`);
  console.log('✨ Database is clean! Ready to generate new Richmond Hill packages.\n');
  console.log('Run: npm run seed:packages 100\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

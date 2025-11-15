import { PrismaClient, PackageStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Simulate package progression through delivery stages
const statusProgression: Record<PackageStatus, PackageStatus | null> = {
  [PackageStatus.PENDING]: PackageStatus.IN_TRANSIT,
  [PackageStatus.IN_TRANSIT]: PackageStatus.AT_HUB,
  [PackageStatus.AT_HUB]: PackageStatus.OUT_FOR_DELIVERY,
  [PackageStatus.OUT_FOR_DELIVERY]: PackageStatus.DELIVERED,
  [PackageStatus.DELIVERED]: null, // Already delivered
  [PackageStatus.FAILED]: null, // Terminal state
  [PackageStatus.RETURNED]: null, // Terminal state
};

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
📦 Package Route Manager
=======================

Usage:
  npm run seed:routes <command> [options]

Commands:
  progress [count]        Move [count] packages to next status (default: 10)
  status <status> [count] Set [count] packages to specific status (default: 5)
  reassign <hubId> [count] Reassign [count] packages to hub (default: 10)
  list                    List all packages with current status

Examples:
  npm run seed:routes progress 20        # Move 20 packages forward
  npm run seed:routes status DELIVERED 5 # Mark 5 packages as delivered
  npm run seed:routes reassign <hub-id>  # Reassign 10 packages to hub
    `);
    return;
  }

  switch (command) {
    case 'progress':
      await progressPackages(parseInt(args[1]) || 10);
      break;
    case 'status':
      await setPackageStatus(args[1] as PackageStatus, parseInt(args[2]) || 5);
      break;
    case 'reassign':
      await reassignPackages(args[1], parseInt(args[2]) || 10);
      break;
    case 'list':
      await listPackages();
      break;
    default:
      console.error(`❌ Unknown command: ${command}`);
  }
}

async function progressPackages(count: number) {
  console.log(`\n📦 Progressing ${count} packages to next status...\n`);

  const packages = await prisma.package.findMany({
    where: {
      status: {
        notIn: [PackageStatus.DELIVERED, PackageStatus.FAILED, PackageStatus.RETURNED],
      },
    },
    take: count,
    orderBy: { createdAt: 'asc' },
  });

  if (packages.length === 0) {
    console.log('❌ No packages found to progress');
    return;
  }

  for (const pkg of packages) {
    const nextStatus = statusProgression[pkg.status];
    if (nextStatus) {
      await prisma.package.update({
        where: { id: pkg.id },
        data: {
          status: nextStatus,
          ...(nextStatus === PackageStatus.DELIVERED && {
            actualDeliveryDate: new Date(),
          }),
        },
      });
      console.log(`✅ ${pkg.trackingNumber}: ${pkg.status} → ${nextStatus}`);
    }
  }

  console.log(`\n✨ Updated ${packages.length} packages\n`);
}

async function setPackageStatus(status: PackageStatus, count: number) {
  if (!Object.values(PackageStatus).includes(status)) {
    console.error(`❌ Invalid status: ${status}`);
    console.log('Valid statuses:', Object.values(PackageStatus).join(', '));
    return;
  }

  console.log(`\n📦 Setting ${count} packages to ${status}...\n`);

  const packages = await prisma.package.findMany({
    where: {
      status: { not: status },
    },
    take: count,
    orderBy: { createdAt: 'desc' },
  });

  if (packages.length === 0) {
    console.log('❌ No packages found to update');
    return;
  }

  for (const pkg of packages) {
    await prisma.package.update({
      where: { id: pkg.id },
      data: {
        status,
        ...(status === PackageStatus.DELIVERED && {
          actualDeliveryDate: new Date(),
        }),
      },
    });
    console.log(`✅ ${pkg.trackingNumber}: ${pkg.status} → ${status}`);
  }

  console.log(`\n✨ Updated ${packages.length} packages to ${status}\n`);
}

async function reassignPackages(hubId: string, count: number) {
  if (!hubId) {
    console.error('❌ Hub ID is required');
    console.log('\nAvailable hubs:');
    const hubs = await prisma.hub.findMany({ where: { status: 'ACTIVE' } });
    hubs.forEach(h => console.log(`  ${h.id} - ${h.name}`));
    return;
  }

  const hub = await prisma.hub.findUnique({ where: { id: hubId } });
  if (!hub) {
    console.error(`❌ Hub not found: ${hubId}`);
    return;
  }

  console.log(`\n📦 Reassigning ${count} packages to ${hub.name}...\n`);

  const packages = await prisma.package.findMany({
    where: {
      assignedHubId: { not: hubId },
      status: {
        notIn: [PackageStatus.DELIVERED, PackageStatus.FAILED, PackageStatus.RETURNED],
      },
    },
    take: count,
  });

  if (packages.length === 0) {
    console.log('❌ No packages available for reassignment');
    return;
  }

  for (const pkg of packages) {
    await prisma.package.update({
      where: { id: pkg.id },
      data: { assignedHubId: hubId },
    });
    console.log(`✅ ${pkg.trackingNumber} reassigned to ${hub.name}`);
  }

  console.log(`\n✨ Reassigned ${packages.length} packages\n`);
}

async function listPackages() {
  console.log('\n📦 All Packages:\n');

  const packages = await prisma.package.findMany({
    include: { hub: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  if (packages.length === 0) {
    console.log('❌ No packages found');
    return;
  }

  packages.forEach(pkg => {
    console.log(`${pkg.trackingNumber} | ${pkg.status.padEnd(20)} | ${pkg.hub?.name || 'Unassigned'} | ${pkg.recipientName}`);
  });

  console.log(`\n📊 Total: ${packages.length} packages (showing latest 50)\n`);

  // Summary by status
  const summary = await prisma.package.groupBy({
    by: ['status'],
    _count: true,
  });

  console.log('Status Summary:');
  summary.forEach(s => {
    console.log(`  ${s.status}: ${s._count}`);
  });
  console.log();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

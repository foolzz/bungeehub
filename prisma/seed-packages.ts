import { PrismaClient, PackageStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Realistic SF addresses for delivery
const SFAddresses = [
  { address: '100 Market St, San Francisco, CA 94102', lat: 37.7942, lng: -122.3986 },
  { address: '200 Mission St, San Francisco, CA 94105', lat: 37.7897, lng: -122.3972 },
  { address: '300 Montgomery St, San Francisco, CA 94104', lat: 37.7930, lng: -122.4023 },
  { address: '400 California St, San Francisco, CA 94104', lat: 37.7933, lng: -122.4045 },
  { address: '500 Pine St, San Francisco, CA 94108', lat: 37.7918, lng: -122.4073 },
  { address: '600 Geary St, San Francisco, CA 94102', lat: 37.7868, lng: -122.4139 },
  { address: '700 Post St, San Francisco, CA 94109', lat: 37.7876, lng: -122.4158 },
  { address: '800 Sutter St, San Francisco, CA 94109', lat: 37.7886, lng: -122.4175 },
  { address: '900 Bush St, San Francisco, CA 94109', lat: 37.7899, lng: -122.4154 },
  { address: '1000 Van Ness Ave, San Francisco, CA 94109', lat: 37.7886, lng: -122.4215 },
];

const recipientNames = [
  'Alice Johnson',
  'Bob Smith',
  'Charlie Brown',
  'David Wilson',
  'Emma Davis',
  'Frank Miller',
  'Grace Lee',
  'Henry Taylor',
  'Isabella Martinez',
  'Jack Anderson',
];

const senders = [
  'Amazon',
  'eBay',
  'Walmart',
  'Target',
  'Best Buy',
  'Apple Store',
  'Nike',
  'Adidas',
  'IKEA',
  'Home Depot',
];

const packageStatuses: PackageStatus[] = [
  PackageStatus.PENDING,
  PackageStatus.IN_TRANSIT,
  PackageStatus.AT_HUB,
  PackageStatus.OUT_FOR_DELIVERY,
  PackageStatus.DELIVERED,
];

// Generate random tracking number
function generateTrackingNumber(index: number): string {
  const prefix = 'TRK';
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const num = String(index).padStart(6, '0');
  return `${prefix}-${date}-${num}`;
}

// Generate random barcode
function generateBarcode(index: number): string {
  const num = String(index).padStart(10, '0');
  return `BC${num}`;
}

// Generate random weight between 0.5 and 10 kg
function randomWeight(): number {
  return Math.round((Math.random() * 9.5 + 0.5) * 10) / 10;
}

// Generate random dimensions
function randomDimensions(): string {
  const l = Math.floor(Math.random() * 30) + 10; // 10-40 cm
  const w = Math.floor(Math.random() * 20) + 10; // 10-30 cm
  const h = Math.floor(Math.random() * 20) + 5;  // 5-25 cm
  return `${l}x${w}x${h}`;
}

async function main() {
  console.log('📦 Starting package generation...\n');

  // Get all active hubs
  const hubs = await prisma.hub.findMany({
    where: { status: 'ACTIVE' },
  });

  if (hubs.length === 0) {
    console.error('❌ No active hubs found. Please run the main seed first.');
    return;
  }

  console.log(`Found ${hubs.length} active hubs:`);
  hubs.forEach(hub => console.log(`  - ${hub.name} (${hub.id})`));
  console.log();

  // Get number of packages to generate from command line or default to 50
  const packageCount = parseInt(process.argv[2]) || 50;
  console.log(`Generating ${packageCount} test packages...\n`);

  const packages = [];

  for (let i = 0; i < packageCount; i++) {
    const addressData = SFAddresses[i % SFAddresses.length];
    const recipientName = recipientNames[i % recipientNames.length];
    const senderName = senders[i % senders.length];
    const status = packageStatuses[Math.floor(Math.random() * packageStatuses.length)];
    const hub = hubs[i % hubs.length]; // Distribute packages across hubs

    // Generate expected delivery date (1-5 days from now)
    const daysUntilDelivery = Math.floor(Math.random() * 5) + 1;
    const expectedDeliveryDate = new Date();
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + daysUntilDelivery);

    const packageData = {
      trackingNumber: generateTrackingNumber(1000 + i),
      barcode: generateBarcode(1000 + i),
      senderName,
      recipientName,
      recipientPhone: `+1555555${String(i).padStart(4, '0')}`,
      deliveryAddress: addressData.address,
      deliveryLatitude: addressData.lat,
      deliveryLongitude: addressData.lng,
      status,
      assignedHub: {
        connect: { id: hub.id }
      },
      weight: randomWeight(),
      dimensions: randomDimensions(),
      expectedDeliveryDate,
      specialInstructions: Math.random() > 0.7 ? 'Leave at front door' : null,
    };

    const pkg = await prisma.package.create({ data: packageData });
    packages.push(pkg);

    if ((i + 1) % 10 === 0) {
      console.log(`✅ Created ${i + 1}/${packageCount} packages...`);
    }
  }

  console.log(`\n✅ Successfully created ${packages.length} packages!\n`);

  // Print summary by status
  console.log('📊 Package Status Summary:');
  for (const status of packageStatuses) {
    const count = packages.filter(p => p.status === status).length;
    console.log(`  ${status}: ${count}`);
  }

  console.log('\n📊 Packages per Hub:');
  for (const hub of hubs) {
    const count = packages.filter(p => p.assignedHubId === hub.id).length;
    console.log(`  ${hub.name}: ${count} packages`);
  }

  console.log('\n✨ Done!\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

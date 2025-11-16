import { PrismaClient, PackageStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Street names for generating realistic addresses
const streetNames = [
  'Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine St', 'Elm Ave',
  'Washington Blvd', 'Lincoln Way', 'Market St', 'Mission St', 'Valencia St',
  'Folsom St', 'Howard St', 'Harrison St', 'Bryant St', 'Brannan St',
  'King St', 'Berry St', 'Townsend St', 'Division St', 'Alameda St'
];

// Calculate distance between two coordinates using Haversine formula (in km)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Generate random coordinates within radius (km) of a center point
function generateRandomLocation(centerLat: number, centerLng: number, maxRadiusKm: number) {
  // Convert radius from km to degrees (approximate)
  const radiusInDegrees = maxRadiusKm / 111.32; // 1 degree ≈ 111.32 km at equator

  // Generate random distance and angle
  const randomDistance = Math.random() * radiusInDegrees;
  const randomAngle = Math.random() * 2 * Math.PI;

  // Calculate new coordinates
  const lat = centerLat + (randomDistance * Math.cos(randomAngle));
  const lng = centerLng + (randomDistance * Math.sin(randomAngle) / Math.cos(centerLat * Math.PI / 180));

  return { lat, lng };
}

// Generate a realistic street address
function generateAddress(lat: number, lng: number): string {
  const streetNumber = Math.floor(Math.random() * 9000) + 1000;
  const street = streetNames[Math.floor(Math.random() * streetNames.length)];
  return `${streetNumber} ${street}, San Francisco, CA 9410${Math.floor(Math.random() * 9)}`;
}

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

// Generate unique tracking number with timestamp
function generateTrackingNumber(index: number): string {
  const prefix = 'TRK';
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  const num = String(index).padStart(4, '0');
  return `${prefix}-${date}-${timestamp}-${num}`;
}

// Generate unique barcode with timestamp
function generateBarcode(index: number): string {
  const timestamp = Date.now().toString().slice(-6);
  const num = String(index).padStart(4, '0');
  return `BC${timestamp}${num}`;
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
    const recipientName = recipientNames[i % recipientNames.length];
    const senderName = senders[i % senders.length];
    const status = packageStatuses[Math.floor(Math.random() * packageStatuses.length)];
    const hub = hubs[i % hubs.length]; // Distribute packages across hubs

    // Generate delivery location within 10km of the hub
    let deliveryLat: number;
    let deliveryLng: number;
    let deliveryAddress: string;

    if (hub.latitude && hub.longitude) {
      // Hub has coordinates - generate nearby delivery address
      const hubLat = parseFloat(hub.latitude.toString());
      const hubLng = parseFloat(hub.longitude.toString());
      const location = generateRandomLocation(hubLat, hubLng, 10); // 10km radius
      deliveryLat = location.lat;
      deliveryLng = location.lng;
      deliveryAddress = generateAddress(deliveryLat, deliveryLng);
    } else {
      // Hub doesn't have coordinates - use default SF location
      const location = generateRandomLocation(37.7749, -122.4194, 10); // SF center
      deliveryLat = location.lat;
      deliveryLng = location.lng;
      deliveryAddress = generateAddress(deliveryLat, deliveryLng);
    }

    const packageData = {
      trackingNumber: generateTrackingNumber(1000 + i),
      barcode: generateBarcode(1000 + i),
      senderName,
      recipientName,
      recipientPhone: `+1555555${String(i).padStart(4, '0')}`,
      deliveryAddress,
      deliveryLatitude: deliveryLat,
      deliveryLongitude: deliveryLng,
      status,
      assignedHub: {
        connect: { id: hub.id }
      },
      weight: randomWeight(),
      dimensions: randomDimensions(),
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
    const hubPackages = packages.filter(p => p.assignedHubId === hub.id);
    const count = hubPackages.length;

    // Calculate average distance if hub has coordinates
    if (hub.latitude && hub.longitude && count > 0) {
      const hubLat = parseFloat(hub.latitude.toString());
      const hubLng = parseFloat(hub.longitude.toString());
      const avgDistance = hubPackages.reduce((sum, pkg) => {
        if (pkg.deliveryLatitude && pkg.deliveryLongitude) {
          const pkgLat = parseFloat(pkg.deliveryLatitude.toString());
          const pkgLng = parseFloat(pkg.deliveryLongitude.toString());
          return sum + calculateDistance(hubLat, hubLng, pkgLat, pkgLng);
        }
        return sum;
      }, 0) / count;
      console.log(`  ${hub.name}: ${count} packages (avg distance: ${avgDistance.toFixed(2)} km)`);
    } else {
      console.log(`  ${hub.name}: ${count} packages`);
    }
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

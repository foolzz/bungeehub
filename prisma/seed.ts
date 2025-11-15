import { PrismaClient, UserRole, HubStatus, HubTier, PackageStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data (in development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Cleaning existing data...');
    await prisma.apiKey.deleteMany();
    await prisma.webhookConfig.deleteMany();
    await prisma.eventLog.deleteMany();
    await prisma.hubReview.deleteMany();
    await prisma.hubMetric.deleteMany();
    await prisma.delivery.deleteMany();
    await prisma.batch.deleteMany();
    await prisma.package.deleteMany();
    await prisma.hub.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Cleaned existing data\n');
  }

  // Create admin user
  console.log('👤 Creating admin user...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@bungiehub.com',
      password: await bcrypt.hash('Admin123!', 10),
      fullName: 'Admin User',
      role: UserRole.ADMIN,
      phone: '+15555550100',
    },
  });
  console.log(`✅ Created admin: ${admin.email}`);

  // Create hub host users
  console.log('\n👤 Creating hub host users...');
  const hubHost1 = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      password: await bcrypt.hash('Password123!', 10),
      fullName: 'John Doe',
      role: UserRole.HUB_HOST,
      phone: '+15555550101',
    },
  });
  console.log(`✅ Created hub host: ${hubHost1.email}`);

  const hubHost2 = await prisma.user.create({
    data: {
      email: 'jane.smith@example.com',
      password: await bcrypt.hash('Password123!', 10),
      fullName: 'Jane Smith',
      role: UserRole.HUB_HOST,
      phone: '+15555550102',
    },
  });
  console.log(`✅ Created hub host: ${hubHost2.email}`);

  const hubHost3 = await prisma.user.create({
    data: {
      email: 'bob.wilson@example.com',
      password: await bcrypt.hash('Password123!', 10),
      fullName: 'Bob Wilson',
      role: UserRole.HUB_HOST,
      phone: '+15555550103',
    },
  });
  console.log(`✅ Created hub host: ${hubHost3.email}`);

  // Create customer users
  console.log('\n👤 Creating customer users...');
  const customer1 = await prisma.user.create({
    data: {
      email: 'customer1@example.com',
      password: await bcrypt.hash('Password123!', 10),
      fullName: 'Alice Johnson',
      role: UserRole.CUSTOMER,
      phone: '+15555550201',
    },
  });
  console.log(`✅ Created customer: ${customer1.email}`);

  const customer2 = await prisma.user.create({
    data: {
      email: 'customer2@example.com',
      password: await bcrypt.hash('Password123!', 10),
      fullName: 'Charlie Brown',
      role: UserRole.CUSTOMER,
      phone: '+15555550202',
    },
  });
  console.log(`✅ Created customer: ${customer2.email}`);

  // Create hubs
  console.log('\n🏠 Creating delivery hubs...');
  const hub1 = await prisma.hub.create({
    data: {
      hostId: hubHost1.id,
      name: 'Downtown Hub',
      address: '123 Main St, San Francisco, CA 94102',
      latitude: 37.7749,
      longitude: -122.4194,
      capacity: 100,
      status: HubStatus.ACTIVE,
      tier: HubTier.SUPER_HUB,
      rating: 4.8,
      totalDeliveries: 523,
    },
  });
  console.log(`✅ Created hub: ${hub1.name} (${hub1.tier})`);

  const hub2 = await prisma.hub.create({
    data: {
      hostId: hubHost2.id,
      name: 'Westside Hub',
      address: '456 Oak Ave, San Francisco, CA 94122',
      latitude: 37.7599,
      longitude: -122.4856,
      capacity: 75,
      status: HubStatus.ACTIVE,
      tier: HubTier.TOP_HUB,
      rating: 4.5,
      totalDeliveries: 287,
    },
  });
  console.log(`✅ Created hub: ${hub2.name} (${hub2.tier})`);

  const hub3 = await prisma.hub.create({
    data: {
      hostId: hubHost3.id,
      name: 'Mission District Hub',
      address: '789 Valencia St, San Francisco, CA 94110',
      latitude: 37.7599,
      longitude: -122.4214,
      capacity: 50,
      status: HubStatus.ACTIVE,
      tier: HubTier.ACTIVE_HUB,
      rating: 4.2,
      totalDeliveries: 145,
    },
  });
  console.log(`✅ Created hub: ${hub3.name} (${hub3.tier})`);

  const hub4 = await prisma.hub.create({
    data: {
      hostId: hubHost1.id,
      name: 'North Beach Hub',
      address: '321 Columbus Ave, San Francisco, CA 94133',
      latitude: 37.8024,
      longitude: -122.4078,
      capacity: 60,
      status: HubStatus.PENDING,
      tier: HubTier.NEW_HUB,
      rating: 0,
      totalDeliveries: 0,
    },
  });
  console.log(`✅ Created hub: ${hub4.name} (${hub4.tier})`);

  // Create packages
  console.log('\n📦 Creating packages...');
  const package1 = await prisma.package.create({
    data: {
      trackingNumber: 'PKG001234567',
      barcode: 'BC001234567',
      senderName: 'Acme Corp',
      recipientName: 'Alice Johnson',
      recipientPhone: '+15555550201',
      deliveryAddress: '100 Market St, San Francisco, CA 94102',
      deliveryLatitude: 37.7942,
      deliveryLongitude: -122.3986,
      status: PackageStatus.AT_HUB,
      assignedHubId: hub1.id,
      weight: 2.5,
      dimensions: { length: 12, width: 8, height: 6 },
      specialInstructions: 'Leave at front door',
    },
  });
  console.log(`✅ Created package: ${package1.trackingNumber} (${package1.status})`);

  const package2 = await prisma.package.create({
    data: {
      trackingNumber: 'PKG001234568',
      barcode: 'BC001234568',
      senderName: 'TechMart',
      recipientName: 'Charlie Brown',
      recipientPhone: '+15555550202',
      deliveryAddress: '200 Mission St, San Francisco, CA 94105',
      deliveryLatitude: 37.7897,
      deliveryLongitude: -122.3972,
      status: PackageStatus.DELIVERED,
      assignedHubId: hub1.id,
      weight: 1.2,
      dimensions: { length: 10, width: 10, height: 4 },
    },
  });
  console.log(`✅ Created package: ${package2.trackingNumber} (${package2.status})`);

  const package3 = await prisma.package.create({
    data: {
      trackingNumber: 'PKG001234569',
      barcode: 'BC001234569',
      senderName: 'Fashion Store',
      recipientName: 'Alice Johnson',
      recipientPhone: '+15555550201',
      deliveryAddress: '100 Market St, San Francisco, CA 94102',
      deliveryLatitude: 37.7942,
      deliveryLongitude: -122.3986,
      status: PackageStatus.OUT_FOR_DELIVERY,
      assignedHubId: hub2.id,
      weight: 0.8,
    },
  });
  console.log(`✅ Created package: ${package3.trackingNumber} (${package3.status})`);

  // Create batches
  console.log('\n📦 Creating batches...');
  const batch1 = await prisma.batch.create({
    data: {
      hubId: hub1.id,
      batchNumber: 'BATCH20251115001',
      totalPackages: 75,
      status: 'DELIVERED',
      deliveredAt: new Date('2025-11-15T08:00:00Z'),
    },
  });
  console.log(`✅ Created batch: ${batch1.batchNumber}`);

  const batch2 = await prisma.batch.create({
    data: {
      hubId: hub2.id,
      batchNumber: 'BATCH20251115002',
      totalPackages: 50,
      status: 'IN_TRANSIT',
    },
  });
  console.log(`✅ Created batch: ${batch2.batchNumber}`);

  // Create deliveries
  console.log('\n🚚 Creating deliveries...');
  const delivery1 = await prisma.delivery.create({
    data: {
      packageId: package2.id,
      hubId: hub1.id,
      hostId: hubHost1.id,
      status: 'DELIVERED',
      photoUrl: 'https://storage.googleapis.com/bungeehub-media/deliveries/photo1.jpg',
      deliveredAt: new Date('2025-11-15T10:30:00Z'),
      latitude: 37.7897,
      longitude: -122.3972,
      deliveryNotes: 'Delivered to front desk',
    },
  });
  console.log(`✅ Created delivery for package: ${package2.trackingNumber}`);

  // Create hub metrics
  console.log('\n📊 Creating hub metrics...');
  const metric1 = await prisma.hubMetric.create({
    data: {
      hubId: hub1.id,
      date: new Date('2025-11-14'),
      packagesReceived: 100,
      packagesDelivered: 95,
      packagesFailed: 5,
      avgDeliveryTime: 180, // 3 hours
      customerRating: 4.7,
    },
  });
  console.log(`✅ Created metrics for ${hub1.name}`);

  const metric2 = await prisma.hubMetric.create({
    data: {
      hubId: hub2.id,
      date: new Date('2025-11-14'),
      packagesReceived: 75,
      packagesDelivered: 70,
      packagesFailed: 5,
      avgDeliveryTime: 210, // 3.5 hours
      customerRating: 4.4,
    },
  });
  console.log(`✅ Created metrics for ${hub2.name}`);

  // Create hub reviews
  console.log('\n⭐ Creating hub reviews...');
  const review1 = await prisma.hubReview.create({
    data: {
      hubId: hub1.id,
      customerId: customer1.id,
      rating: 5,
      comment: 'Excellent service! Package arrived on time and in perfect condition.',
    },
  });
  console.log(`✅ Created review for ${hub1.name}`);

  const review2 = await prisma.hubReview.create({
    data: {
      hubId: hub1.id,
      customerId: customer2.id,
      rating: 4,
      comment: 'Good service, delivery was prompt.',
    },
  });
  console.log(`✅ Created review for ${hub1.name}`);

  // Create event logs
  console.log('\n📝 Creating event logs...');
  await prisma.eventLog.create({
    data: {
      eventType: 'package_scanned',
      entityType: 'package',
      entityId: package1.id,
      metadata: {
        scannedBy: hubHost1.id,
        location: hub1.name,
        timestamp: new Date().toISOString(),
      },
    },
  });

  await prisma.eventLog.create({
    data: {
      eventType: 'delivery_completed',
      entityType: 'delivery',
      entityId: delivery1.id,
      metadata: {
        packageId: package2.id,
        hubId: hub1.id,
        deliveryTime: '3.5 hours',
      },
    },
  });
  console.log(`✅ Created event logs`);

  // Create webhook config
  console.log('\n🔗 Creating webhook configuration...');
  await prisma.webhookConfig.create({
    data: {
      name: 'B2B System Integration',
      url: 'https://api.b2bsystem.com/webhooks/bungiehub',
      events: ['package_delivered', 'package_failed', 'batch_completed'],
      secret: 'webhook_secret_key_12345',
      active: true,
    },
  });
  console.log(`✅ Created webhook config`);

  // Create API key
  console.log('\n🔑 Creating API key...');
  await prisma.apiKey.create({
    data: {
      keyHash: await bcrypt.hash('test_api_key_12345', 10),
      name: 'B2B Integration Key',
      permissions: ['read_packages', 'create_packages', 'read_deliveries'],
      active: true,
    },
  });
  console.log(`✅ Created API key`);

  console.log('\n✅ Database seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   Users: ${await prisma.user.count()}`);
  console.log(`   Hubs: ${await prisma.hub.count()}`);
  console.log(`   Packages: ${await prisma.package.count()}`);
  console.log(`   Deliveries: ${await prisma.delivery.count()}`);
  console.log(`   Batches: ${await prisma.batch.count()}`);
  console.log(`   Reviews: ${await prisma.hubReview.count()}`);
  console.log(`   Metrics: ${await prisma.hubMetric.count()}`);
  console.log(`   Event Logs: ${await prisma.eventLog.count()}`);
  console.log(`   Webhooks: ${await prisma.webhookConfig.count()}`);
  console.log(`   API Keys: ${await prisma.apiKey.count()}\n`);

  console.log('🔐 Test Credentials:');
  console.log('   Admin: admin@bungiehub.com / Admin123!');
  console.log('   Hub Host 1: john.doe@example.com / Password123!');
  console.log('   Hub Host 2: jane.smith@example.com / Password123!');
  console.log('   Hub Host 3: bob.wilson@example.com / Password123!');
  console.log('   Customer 1: customer1@example.com / Password123!');
  console.log('   Customer 2: customer2@example.com / Password123!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  // Note: order matters due to foreign key constraints
  await prisma.leadAssignment.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.allocationState.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.service.deleteMany();
  await prisma.webhookEvent.deleteMany();

  console.log('Seeding Services...');
  const services = [];
  for (let i = 1; i <= 3; i++) {
    const service = await prisma.service.create({
      data: { name: `Service ${i}` },
    });
    services.push(service);
  }

  console.log('Seeding Providers...');
  for (let i = 1; i <= 8; i++) {
    await prisma.provider.create({
      data: {
        name: `Provider ${i}`,
        monthlyQuota: 10,
        leadsReceived: 0,
      },
    });
  }

  console.log('Seeding AllocationStates...');
  for (const service of services) {
    await prisma.allocationState.create({
      data: {
        serviceId: service.id,
        lastProviderIndex: 0,
      },
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

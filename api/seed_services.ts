import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.service.createMany({
    data: [
      { tenantId: 'pitaya', name: 'Consulta General', duration: 60, price: 500 },
      { tenantId: 'pitaya', name: 'Limpieza Dental', duration: 45, price: 800 },
      { tenantId: 'pitaya', name: 'Consulta', duration: 30, price: 0 }
    ],
    skipDuplicates: true
  });
  console.log('Services seeded successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

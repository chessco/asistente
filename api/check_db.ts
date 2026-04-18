import prisma from './prisma-client.js';

async function main() {
  const appointments = await prisma.appointment.findMany();
  console.log(JSON.stringify(appointments, null, 2));
}

main().catch(console.error).finally(() => process.exit());


const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const registrations = await prisma.registration.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
    });
    console.log(JSON.stringify(registrations, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

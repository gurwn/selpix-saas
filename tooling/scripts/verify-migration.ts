
import { PrismaClient } from "@myapp/prisma";

const prisma = new PrismaClient();

async function main() {
    console.log("Verifying migration...");

    const productCount = await prisma.product.count();
    const recCount = await prisma.recommendation.count();
    const marginCount = await prisma.margin.count();
    const detailCount = await prisma.detailPage.count();
    const regCount = await prisma.registration.count();
    const logCount = await prisma.activityLog.count();

    console.log(`Products: ${productCount}`);
    console.log(`Recommendations: ${recCount}`);
    console.log(`Margins: ${marginCount}`);
    console.log(`Detail Pages: ${detailCount}`);
    console.log(`Registrations: ${regCount}`);
    console.log(`Logs: ${logCount}`);

    if (productCount > 0 && recCount > 0) {
        console.log("VERIFICATION SUCCESS: Data exists in Supabase.");
    } else {
        console.error("VERIFICATION FAILED: Tables appear empty.");
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

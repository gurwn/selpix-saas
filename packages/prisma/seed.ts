import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding plans...");

    const plans = [
        {
            id: "plan_free",
            name: "FREE",
            title: "Free Beta",
            description: "Get started with Selpix beta.",
            price: 0,
            currency: "USD",
            available: false,
            lemonSqueezyProductId: process.env.LEMON_PRODUCT_ID || "PRODUCT_ID_PLACEHOLDER",
            lemonSqueezyVariantId: process.env.LEMON_VARIANT_FREE || "VARIANT_FREE",
            content: ["plans.free.credits", "plans.free.projects", "plans.free.ai", "plans.free.support"],
        },
        // Pro plan is manually managed by user (id: pln_personal_pro)
        // We do not seed it here to avoid duplication.
        {
            id: "plan_max5",
            name: "MAX5",
            title: "Max 5",
            description: "Heavy usage for power sellers.",
            price: 70,
            currency: "USD",
            available: false,
            lemonSqueezyProductId: process.env.LEMON_PRODUCT_ID || "PRODUCT_ID_PLACEHOLDER",
            lemonSqueezyVariantId: process.env.LEMON_VARIANT_MAX5 || "VARIANT_MAX5",
            content: ["plans.max5.credits", "plans.max5.usage", "plans.max5.ai", "plans.max5.image"],
        },
        {
            id: "plan_max20",
            name: "MAX20",
            title: "Max 20",
            description: "Enterprise scale.",
            price: 120,
            currency: "USD",
            available: false,
            lemonSqueezyProductId: process.env.LEMON_PRODUCT_ID || "PRODUCT_ID_PLACEHOLDER",
            lemonSqueezyVariantId: process.env.LEMON_VARIANT_MAX20 || "VARIANT_MAX20",
            content: ["plans.max20.credits", "plans.max20.usage", "plans.max20.ai", "plans.max20.context"],
        },
    ];

    for (const plan of plans) {
        // We use title or name as a unique key for update if possible, or usually we'd upsert by ID if fixed.
        // For now, finding by name seems safest if ID isn't fixed.
        // But name is unique in schema? Let's assume unique constraint or just create if not exists.
        // Schema says: model Plan { ... } usually has ID.
        // I will check if it exists by name.

        const existing = await prisma.plan.findFirst({
            where: { name: plan.name }
        });

        if (existing) {
            console.log(`Plan ${plan.name} already exists. Updating...`);
            await prisma.plan.update({
                where: { id: existing.id },
                data: plan
            });
        } else {
            console.log(`Creating plan ${plan.name}...`);
            await prisma.plan.create({
                data: plan
            });
        }
    }

    console.log("Seeding completed.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

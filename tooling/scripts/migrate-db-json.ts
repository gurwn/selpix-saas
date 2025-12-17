
import { PrismaClient } from "@myapp/prisma";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting db.json migration...");

    const dbJsonPath = path.resolve(__dirname, "../../db.json");
    const rawData = fs.readFileSync(dbJsonPath, "utf-8");
    const data = JSON.parse(rawData);

    console.log("Reading data from db.json...");

    // 1. Migrate Products
    if (data.products && Array.isArray(data.products)) {
        console.log(`Migrating ${data.products.length} products...`);
        for (const p of data.products) {
            await prisma.product.create({
                data: {
                    name: p.name,
                    wholesalePrice: p.wholesalePrice,
                    recommendedPrice: p.recommendedPrice,
                    margin: p.margin,
                    competition: p.competition,
                    searchVolume: p.searchVolume,
                    category: p.category,
                    image: p.image,
                    source: p.source,
                    trend: p.trend,
                    score: p.score,
                    // Mapping ID if possible, but auto-increment is default. 
                    // We let Postgres handle IDs to avoid conflicts, or we can force it if needed.
                    // For now, simpler to recreate.
                },
            });
        }
    }

    // 2. Migrate Recommendations
    if (data.recommendations && Array.isArray(data.recommendations)) {
        console.log(`Migrating ${data.recommendations.length} recommendations...`);
        for (const rec of data.recommendations) {
            const createdRec = await prisma.recommendation.create({
                data: {
                    keyword: rec.keyword,
                }
            });

            if (rec.products && Array.isArray(rec.products)) {
                for (const item of rec.products) {
                    await prisma.recommendationItem.create({
                        data: {
                            recommendationId: createdRec.id,
                            name: item.name,
                            wholesalePrice: item.wholesalePrice,
                            recommendedPrice: item.recommendedPrice,
                            margin: item.margin,
                            competition: item.competition,
                            searchVolume: item.searchVolume,
                            trend: item.trend,
                            score: item.score
                        }
                    })
                }
            }
        }
    }

    // 3. Migrate Margins
    // Note: db.json margins have 'productName' but we ideally link to new Product IDs.
    // For this migration, we will store them as is or try to match by name if critical.
    // The schema allows nullable productId.
    if (data.margins && Array.isArray(data.margins)) {
        console.log(`Migrating ${data.margins.length} margin records...`);
        for (const m of data.margins) {
            // Try to find product by name to link
            const product = await prisma.product.findFirst({ where: { name: m.productName } });

            await prisma.margin.create({
                data: {
                    productId: product?.id,
                    productName: m.productName,
                    wholesalePrice: m.wholesalePrice,
                    sellingPrice: m.sellingPrice,
                    shippingCost: m.shippingCost,
                    commission: m.commission,
                    adCost: m.adCost,
                    packagingCost: m.packagingCost,
                    netMargin: m.netMargin,
                    marginRate: m.marginRate,
                    platform: m.platform,
                    calculatedAt: new Date(m.calculatedAt)
                }
            })
        }
    }

    // 4. Migrate Detail Pages
    if (data.detailPages && Array.isArray(data.detailPages)) {
        console.log(`Migrating ${data.detailPages.length} detail pages...`);
        for (const d of data.detailPages) {
            const product = await prisma.product.findFirst({ where: { name: d.productName } });

            await prisma.detailPage.create({
                data: {
                    productId: product?.id,
                    productName: d.productName,
                    summary: d.summary,
                    usps: d.usps,
                    keywords: d.keywords,
                    template: d.template
                }
            })
        }
    }

    // 5. Migrate Registrations
    if (data.registrations && Array.isArray(data.registrations)) {
        console.log(`Migrating ${data.registrations.length} registrations...`);
        for (const r of data.registrations) {
            const product = await prisma.product.findFirst({ where: { name: r.productName } });

            await prisma.registration.create({
                data: {
                    productId: product?.id,
                    productName: r.productName,
                    category: r.category,
                    recommendedTitle: r.recommendedTitle,
                    price: r.price,
                    wholesalePrice: r.wholesalePrice,
                    status: r.status,
                    platform: r.platform
                }
            })
        }
    }

    // 6. Migrate Logs
    if (data.logs && Array.isArray(data.logs)) {
        console.log(`Migrating ${data.logs.length} logs...`);
        for (const l of data.logs) {
            await prisma.activityLog.create({
                data: {
                    action: l.action,
                    productName: l.productName,
                    status: l.status,
                    price: l.price,
                    details: l.details,
                    timestamp: new Date(l.timestamp)
                }
            })
        }
    }

    console.log("Migration completed successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

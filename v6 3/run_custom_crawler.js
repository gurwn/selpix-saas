const crawler = require('./crawler');

const KEYWORD = "국내제작 마이보틀 트라이탄 아이스 판촉물 텀블러 물통 물병 주문제작 100개 인쇄비무료";

async function main() {
    console.log(`🚀 Searching for: ${KEYWORD}`);
    try {
        const products = await crawler.crawlDomeggook(KEYWORD);
        console.log(`✅ Found ${products.length} products.`);

        if (products.length > 0) {
            const best = products[0];
            console.log(`\n🎯 TOP RESULT:`);
            console.log(`Name: ${best.name}`);
            console.log(`Image URL: ${best.imageUrl}`);
            console.log(`Price: ${best.price}`);
            console.log(`ProductNo: ${best.productNo}`);
        } else {
            console.log("❌ No products found.");
        }
    } catch (err) {
        console.error("❌ Error running crawler:", err);
    } finally {
        if (crawler.browser) {
            await crawler.close();
        }
    }
}

main();

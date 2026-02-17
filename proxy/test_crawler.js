const { CrawlerService } = require('./crawler');

(async () => {
    console.log('Starting crawler test...');
    const crawler = new CrawlerService();
    try {
        const results = await crawler.crawlDomeggook('양말', 0, 100000);
        console.log(`Found ${results.length} products.`);
        if (results.length > 0) {
            console.log('Sample:', results[0]);
        } else {
            console.log('No products found. Selector might be wrong.');
        }
    } catch (error) {
        console.error('Crawler error:', error);
    } finally {
        await crawler.close();
    }
})();

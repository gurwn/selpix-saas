import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const HEADLESS_MODE = (process.env.PUPPETEER_HEADLESS ?? 'true').toLowerCase() !== 'false';
const EXECUTABLE_PATH = process.env.PUPPETEER_EXECUTABLE_PATH;

export interface CrawledProduct {
    name: string;
    price: number;
    priceText?: string;
    imageUrl: string | null;
    sourceUrl: string | null;
    site: string;
    category?: string;
    productNo?: string | null;
    minOrderQuantity?: number;
    shippingCost?: number;
    shippingText?: string | null;
    currency?: string;
    optionPopupUrl?: string | null;
}

export class CrawlerService {
    private browser: Browser | null = null;

    async init() {
        if (!this.browser) {
            const launchConfig: any = {
                headless: HEADLESS_MODE ? 'new' : false,
                defaultViewport: HEADLESS_MODE ? { width: 1280, height: 800 } : null,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            };

            if (EXECUTABLE_PATH) {
                launchConfig.executablePath = EXECUTABLE_PATH;
            }

            this.browser = await puppeteer.launch(launchConfig);
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    async optimizePage(page: Page) {
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const resourceType = req.resourceType();
            if (['image', 'stylesheet', 'font', 'media', 'imageset'].includes(resourceType)) {
                req.abort();
            } else {
                req.continue();
            }
        });
    }

    async crawlDomeggook(keyword: string, minPrice = 0, maxPrice = 1000000): Promise<CrawledProduct[]> {
        const products: CrawledProduct[] = [];
        let page: Page | null = null;

        try {
            await this.init();
            if (!this.browser) throw new Error('Browser not initialized');

            page = await this.browser.newPage();
            await page.setViewport({ width: 1280, height: 800 });
            await page.setUserAgent(process.env.USER_AGENT || DEFAULT_USER_AGENT);

            await this.optimizePage(page);

            await page.goto('https://www.domeggook.com/main', { waitUntil: 'domcontentloaded', timeout: 30000 });

            const inputSelector = '#searchWordForm, input[name="searchword"], input#searchWord';
            await page.waitForSelector(inputSelector, { timeout: 10000 });
            await page.type(inputSelector, keyword);

            await Promise.all([
                page.keyboard.press('Enter'),
                page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 })
            ]);

            const itemSelector = 'ol.lItemList > li';
            try { await page.waitForSelector(itemSelector, { timeout: 15000 }); } catch (e) { console.warn('Selector wait failed'); }

            // Using evaluate to run code in browser context
            const scraped = await page.evaluate((min: number, max: number, kw: string) => {
                const items = document.querySelectorAll('ol.lItemList > li');
                const results: any[] = [];

                items.forEach((item) => {
                    if (results.length >= 30) return;

                    const titleEl = item.querySelector('a.title');
                    const priceEl = item.querySelector('div.amtqty.amtQtyMargin > div.amt > b');
                    const imgEl = item.querySelector('a.thumb img');
                    const unitQtyEl = item.querySelector('div.amtqty.amtQtyMargin .unitQty');
                    const shippingEl = item.querySelector('div.amtqty.amtQtyMargin .infoDeli');

                    const name = titleEl?.textContent?.trim();
                    const priceText = priceEl?.textContent?.trim();

                    const normalizePrice = (text: string | undefined | null) => {
                        if (!text) return null;
                        const numeric = parseInt(text.replace(/[^0-9]/g, ''), 10);
                        return Number.isNaN(numeric) ? null : numeric;
                    };

                    const numericPrice = normalizePrice(priceText);

                    if (!name || numericPrice === null) return;
                    if (numericPrice < min || numericPrice > max) return;

                    const rawHref = titleEl?.getAttribute('href') || '';
                    const sourceUrl = rawHref.startsWith('http') ? rawHref : `https://www.domeggook.com/${rawHref.replace(/^\/+/, '')}`;

                    const productNoMatch = sourceUrl.match(/(?:no=|itemno=|itemNo=)(\d{4,})/i);
                    const productNo = productNoMatch ? productNoMatch[1] : null;

                    let imageUrl = imgEl?.getAttribute('src') || null;
                    if (imageUrl && !imageUrl.startsWith('http')) {
                        imageUrl = `https://cdn1.domeggook.com/${imageUrl.replace(/^\/+/, '')}`;
                    }

                    results.push({
                        name,
                        price: numericPrice,
                        priceText,
                        imageUrl,
                        sourceUrl,
                        productNo,
                        site: 'domeggook',
                        category: kw,
                        currency: 'KRW',
                        minOrderQuantity: normalizePrice(unitQtyEl?.textContent) || 1,
                        shippingCost: normalizePrice(shippingEl?.textContent) || 0,
                        shippingText: shippingEl?.textContent?.trim()
                    });
                });
                return results;
            }, minPrice, maxPrice, keyword);

            products.push(...scraped);

        } catch (error) {
            console.error('Domeggook crawl failed:', error);
        } finally {
            if (page) await page.close();
        }

        return products;
    }

    async crawlAllSites(keyword: string): Promise<CrawledProduct[]> {
        // Currently supporting Domeggook as per previous implementation priority
        return this.crawlDomeggook(keyword);
    }
}

export const crawlerService = new CrawlerService();

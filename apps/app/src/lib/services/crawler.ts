
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

    // Enriched fields
    detailImages?: string[];
    detailHtml?: string | null;
    detailText?: string | null;
    description?: string;
    imageUsageText?: string | null;
    imageUsageStatus?: string;
    tags?: string[];
    // Supplier info
    supplierName?: string;
    supplierContact?: string | null;
    supplierEmail?: string | null;
    supplierAddress?: string | null;
    supplierBizNo?: string | null;
    options?: any[];
}

export class CrawlerService {
    private browser: Browser | null = null;

    async init() {
        if (this.browser && !this.browser.isConnected()) {
            console.warn('Browser is not connected. Resetting...');
            this.browser = null;
        }

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

            try {
                this.browser = await puppeteer.launch(launchConfig);
            } catch (error) {
                console.error('Failed to launch browser:', error);
                throw error;
            }
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
            // Blocking images might prevent some sites from setting the correct src via JS
            if (['font', 'media', 'imageset'].includes(resourceType)) {
                req.abort();
            } else {
                req.continue();
            }
        });
    }

    normalizeDomeggookUrl(url: string | null | undefined): string | null {
        if (!url) return null;
        const trimmed = url.trim();
        if (!trimmed) return null;
        if (/^data:/i.test(trimmed)) return trimmed;
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        if (trimmed.startsWith('//')) return `https:${trimmed}`;
        return `https://www.domeggook.com/${trimmed.replace(/^\/+/, '')}`;
    }

    extractDomeItemNo(input: string | null | undefined): string | null {
        if (!input) return null;
        const s = String(input);
        const m = s.match(/(?:no=|itemno=|itemNo=)(\d{4,})/i);
        if (m) return m[1];
        const k = s.match(/상품번호\s*[:：]?\s*([0-9]{4,})/);
        return k ? k[1] : null;
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
                    const sellerEl = item.querySelector('.seller .nick a') || item.querySelector('a[href*="sf=id"]');

                    const name = titleEl?.textContent?.trim();
                    const priceText = priceEl?.textContent?.trim();
                    const supplierName = sellerEl ? sellerEl.textContent?.trim() : undefined;

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

                    // Improved image extraction for lazy loading
                    let imageUrl = imgEl?.getAttribute('data-original') || imgEl?.getAttribute('data-src') || imgEl?.getAttribute('src') || null;
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
                        shippingCost: normalizePrice(shippingEl?.textContent) || (shippingEl?.textContent?.includes('무료') ? 0 : 3000),
                        shippingText: shippingEl?.textContent?.trim() || null,
                        site: 'domeggook',
                        category: kw,
                        currency: 'KRW',
                        minOrderQuantity: normalizePrice(unitQtyEl?.textContent) || 1,
                        supplierName
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

    async enrichDomeggookProduct(product: CrawledProduct): Promise<CrawledProduct> {
        if (!product?.sourceUrl) {
            return { ...product, detailImages: [], imageUsageText: null, imageUsageStatus: 'unknown' };
        }

        let detailPage: Page | null = null;

        try {
            await this.init();
            if (!this.browser) throw new Error('Browser not initialized');

            detailPage = await this.browser.newPage();
            await detailPage.setViewport({ width: 1280, height: 1600 });
            await detailPage.setUserAgent(process.env.USER_AGENT || DEFAULT_USER_AGENT);

            await this.optimizePage(detailPage);

            await detailPage.goto(product.sourceUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            try { await detailPage.waitForSelector('#lInfoViewItemContents', { timeout: 10000 }); } catch (e) { }

            const containerHtml = await detailPage.$eval('#lInfoViewItemContents', el => el.innerHTML).catch(() => null);
            const fullHtml = await detailPage.content();
            const $full = cheerio.load(fullHtml);

            let scrapedProductNo = null;
            const infoHeaderRaw = $full('#lInfoHeader').text();
            const noMatch = infoHeaderRaw.match(/상품번호\s*[:：]?\s*(\d+)/);
            if (noMatch) {
                scrapedProductNo = noMatch[1];
            }
            if (!scrapedProductNo || scrapedProductNo.length < 5) {
                // Legacy crawler fallback logic
                scrapedProductNo = product.productNo || this.extractDomeItemNo(fullHtml) || this.extractDomeItemNo(product.sourceUrl);
            }

            const thumbSrc = await detailPage.$eval('#lThumbImg', (img: any) => img.getAttribute('src')).catch(() => null);
            const normalizedThumb = this.normalizeDomeggookUrl(thumbSrc);

            const detailContent = this.extractDetailContent(containerHtml);
            const imageUsageText = this.extractImageUsageText($full);
            // const imageUsageStatus = this.parseImageUsageStatus(imageUsageText); // Skipping for brevity, defaulting to unknown
            const supplierInfo = this.extractSupplierInfo($full);

            const domItemNo = scrapedProductNo;

            // Legacy Logic: Try document options first, then Popup if missing and we have a productNo
            let options = this.extractOptionsFromDocument($full);
            if ((!options || options.length === 0) && domItemNo && domItemNo.length >= 5) {
                const popupOptions = await this.fetchOptionsFromPopup(domItemNo);
                if (popupOptions.length) options = popupOptions;
            }

            const fallbackDescription = `${product.site ? product.site.toUpperCase() : '도매'} 소싱 상품`;
            const description = (detailContent.text || fallbackDescription || '').trim();
            const detailImagesRaw = detailContent.images.length ? detailContent.images : this.extractDetailImagesFromDocument($full);
            const detailImages = normalizedThumb ? [normalizedThumb, ...detailImagesRaw] : detailImagesRaw;
            const primaryImage = product.imageUrl || normalizedThumb || null;

            // Scrape Title and Price if missing (Direct Link Scenario)
            let name = product.name;
            let price = product.price;

            if (!name || name === 'Unknown') {
                // Try to find title
                name = $full('h1').text().trim() || $full('.lInfoTitle').text().trim() || $full('meta[property="og:title"]').attr('content') || '';
            }

            if (!price || price === 0) {
                // Try to find price
                const priceText = $full('#lBaseAmtVal').text() || $full('.lInfoPrice .price strong').text() || $full('.lInfoPrice').text();
                const numeric = parseInt(priceText.replace(/[^0-9]/g, ''), 10);
                if (!isNaN(numeric)) price = numeric;
            }

            // Scrape Tags/Keywords
            const metaKeywords = $full('meta[name="keywords"]').attr('content');
            const tags = metaKeywords ? metaKeywords.split(',').map(s => s.trim()).filter(Boolean) : [];

            // Scrape Shipping Cost
            let shippingCost = product.shippingCost;
            let shippingText = product.shippingText;

            if (shippingCost === undefined) {
                // Try to find delivery info in the table
                const deliveryRow = $full('table.lTbl tr, table.lInfoViewTbl tr').filter((i, el) => {
                    const text = $full(el).text();
                    return text.includes('배송') || text.includes('택배');
                });

                const deliveryText = deliveryRow.text();
                if (deliveryText.includes('무료')) {
                    shippingCost = 0;
                    shippingText = '무료배송';
                } else {
                    const costMatch = deliveryText.match(/([\d,]+)원/);
                    if (costMatch) {
                        shippingCost = parseInt(costMatch[1].replace(/,/g, ''), 10);
                        shippingText = `${shippingCost.toLocaleString()}원`;
                    } else {
                        // Default fallback
                        shippingCost = 3000;
                        shippingText = '3,000원';
                    }
                }
            }

            // Scrape Minimum Order Quantity
            let minOrderQuantity = product.minOrderQuantity || 1;
            const moqRow = $full('table.lTbl tr, table.lInfoViewTbl tr').filter((i, el) => {
                const text = $full(el).text();
                return text.includes('최소구매수량') || text.includes('구매수량');
            });
            const moqText = moqRow.text();
            const moqMatch = moqText.match(/(\d+)개/);
            if (moqMatch) {
                minOrderQuantity = parseInt(moqMatch[1], 10);
            }

            return {
                ...product,
                name,
                price,
                shippingCost,
                shippingText,
                imageUrl: primaryImage,
                detailImages,
                detailHtml: detailContent.html,
                detailText: detailContent.text,
                description,
                imageUsageText,
                productNo: domItemNo || null,
                optionPopupUrl: domItemNo ? `https://domeggook.com/main/popup/item/popup_itemOptionView.php?no=${domItemNo}&market=dome` : null,
                options,
                tags,
                supplierName: supplierInfo.supplierName,
                supplierContact: supplierInfo.supplierContact,
                supplierEmail: supplierInfo.supplierEmail,
                supplierAddress: supplierInfo.supplierAddress,
                supplierBizNo: supplierInfo.supplierBizNo
            };

        } catch (error) {
            console.warn(`Failed to enrich Domeggook product: ${error}`);
            return product;
        } finally {
            if (detailPage) await detailPage.close();
        }
    }

    // Ported from v6 3/crawler.js
    async fetchOptionsFromPopup(productNo: string): Promise<any[]> {
        if (!productNo) return [];
        let page: Page | null = null;
        try {
            await this.init();
            if (!this.browser) return [];

            page = await this.browser.newPage();
            await this.optimizePage(page);

            const popupUrl = `https://domeggook.com/main/popup/item/popup_itemOptionView.php?no=${productNo}&market=dome`;

            // Ignore navigation timeout as per legacy code recommendation
            try { await page.goto(popupUrl, { waitUntil: 'domcontentloaded', timeout: 8000 }); } catch (e) { }

            const html = await page.content();
            const $ = cheerio.load(html);
            const values: string[] = [];

            // 1. Table Logic (New in Legacy)
            const $table = $('#itemOptAllViewTable');
            if ($table.length) {
                $table.find('tbody tr').each((_, tr) => {
                    const $tds = $(tr).find('td');
                    if ($tds.length >= 4) {
                        // 2nd TD is Option Value
                        let optVal = $tds.eq(1).text().trim();

                        // Check for Sold Out
                        const stockText = $tds.eq(3).text().replace(/,/g, '').trim();
                        const stock = parseInt(stockText, 10) || 0;

                        if (optVal.includes('판매종료') || stock <= 0) {
                            optVal += ' (품절)';
                        }

                        // Check for extra price
                        const priceText = $tds.eq(2).text().trim();
                        const extraPriceMatch = priceText.match(/\(\+([\d,]+)원\)/);
                        if (extraPriceMatch) {
                            optVal += ` (+${extraPriceMatch[1]}원)`;
                        }

                        if (optVal) values.push(optVal);
                    }
                });
            }

            // 2. Buttons (Fallback)
            if (values.length === 0) {
                $('.pSelectUIMenu button, .pSelectUIBtn').each((_, el) => {
                    const txt = $(el).text().replace(/\s+/g, ' ').trim();
                    if (txt) values.push(txt);
                });
            }

            // 3. Select Box (Fallback)
            if (values.length === 0) {
                $('select[name^="op"] option, select.lSelect option').each((_, el) => {
                    const txt = $(el).text().replace(/\s+/g, ' ').trim();
                    if (txt && !/^선택/i.test(txt)) values.push(txt);
                });
            }

            const unique = Array.from(new Set(values));
            return unique.length ? [{ name: '옵션', type: 'select', values: unique }] : [];

        } catch (e) {
            return [];
        } finally {
            if (page) await page.close();
        }
    }

    extractDetailContent(containerHtml: string | null) {
        if (!containerHtml) return { html: null, text: null, images: [] };
        const $content = cheerio.load(containerHtml, { decodeEntities: false } as any);
        const images = new Set<string>();
        const self = this;

        $content('script, style, iframe, noscript').remove();
        $content('img').each(function () {
            const $img = $content(this);
            const src = $img.attr('src') || $img.attr('data-src');
            const normalized = self.normalizeDomeggookUrl(src);
            if (normalized) images.add(normalized);
        });

        return {
            html: $content.html(),
            text: $content.text().trim(),
            images: Array.from(images).slice(0, 50)
        };
    }

    extractDetailImagesFromDocument($detail: any): string[] {
        const images = new Set<string>();
        $detail('img').each((_: any, el: any) => {
            const $img = $detail(el);
            const src = $img.attr('src');
            const normalized = this.normalizeDomeggookUrl(src);
            if (normalized) images.add(normalized);
        });
        return Array.from(images).slice(0, 30);
    }

    // Ported from v6 3/crawler.js (More robust supplier info extraction)
    extractSupplierInfo($doc: any) {
        const info: any = {};
        const debugRows: any[] = [];

        // Try to find the specific table first (usually in a popup or specific div)
        // Based on browser inspection: #lSellerPopInfoDetail or tables with matching headers
        $doc('table.lTbl tr, table.lInfoViewTbl tr').each((_: any, tr: any) => {
            const $tr = $doc(tr);
            const $th = $tr.find('th').first();
            const $tds = $tr.find('td');

            if (!$th.length || !$tds.length) return;

            const key = $th.text().replace(/\s+/g, ' ').trim();
            const val = $tds.map((i: any, el: any) => $doc(el).text().replace(/\s+/g, ' ').trim()).get().join(' ');

            if (!key || !val) return;

            if (/공급사|판매자/i.test(key)) info.supplierName = val;
            if (/문의|연락처|전화/i.test(key)) info.supplierContact = val;
            if (/이메일/i.test(key)) info.supplierEmail = val;
            if (/주소|소재지/i.test(key)) info.supplierAddress = val;
            if (/등록번호/i.test(key)) info.supplierBizNo = val;
        });

        // Fallback: Check if name is hidden behind button
        if (!info.supplierName) {
            const btnName = $doc('#lBtnShowSellerInfo b').first().text().trim();
            if (btnName) info.supplierName = btnName;
        }

        return info;
    }

    extractImageUsageText($detail: any) {
        // Robust usage check based on specific table structure
        // Selector: table.lInfoViewSubTbl .lInfoViewImgUse
        const specificStatus = $detail('table.lInfoViewSubTbl .lInfoViewImgUse').text().trim();
        if (specificStatus) return specificStatus; // e.g., "사용허용", "사용불가"

        // Fallback: deeply search for the label row
        let status = null;
        $detail('table.lInfoViewSubTbl tr').each((_: any, tr: any) => {
            const rowText = $detail(tr).text();
            if (rowText.includes('이미지 사용여부') || rowText.includes('이미지사용여부')) {
                status = $detail(tr).find('td').last().text().trim();
            }
        });
        if (status) return status;

        return null;
    }

    extractOptionsFromDocument($doc: any): any[] {
        const options: any[] = [];
        $doc('select').each((_: any, sel: any) => {
            const vals: string[] = [];
            $doc(sel).find('option').each((__: any, opt: any) => {
                const txt = $doc(opt).text().trim();
                if (txt && !/^선택/.test(txt)) vals.push(txt);
            });
            if (vals.length) options.push({ name: $doc(sel).attr('name') || '옵션', values: vals });
        });
        return options;
    }

    async crawlAllSites(keyword: string): Promise<CrawledProduct[]> {
        return this.crawlDomeggook(keyword);
    }
}

export const crawlerService = new CrawlerService();

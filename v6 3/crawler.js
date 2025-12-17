const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const HEADLESS_MODE = (process.env.PUPPETEER_HEADLESS ?? 'true').toLowerCase() !== 'false';
const EXECUTABLE_PATH = process.env.PUPPETEER_EXECUTABLE_PATH;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class WebCrawler {
  constructor() {
    this.browser = null;
    this.isRunning = false;
  }

  async init() {
    if (!this.browser) {
      const launchConfig = {
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
        console.log(`🛠 Using custom Chrome executable: ${EXECUTABLE_PATH}`);
      }

      this.browser = await puppeteer.launch(launchConfig);
      console.log('🌐 Puppeteer browser initialized');
    }
  }

  // 리소스 차단 설정 (이미지/폰트 등)
  async optimizePage(page) {
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

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('🌐 Puppeteer browser closed');
    }
  }

  // ... (이전 코드와 동일: crawlCoupang, crawl11st, crawlGmarket, crawlDomeggook)
  // 편의를 위해 전체 코드를 제공합니다.

  async crawlCoupang(keyword, minPrice = 0, maxPrice = 1000000) {
    const products = [];
    let page;
    try {
      await this.init();
      page = await this.browser.newPage();
      await page.setUserAgent(process.env.USER_AGENT || DEFAULT_USER_AGENT);
      await page.setExtraHTTPHeaders({ 'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7' });
      await page.setViewport({ width: 1920, height: 1080 });
      const searchUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent(keyword)}`;
      console.log(`🔍 Crawling Coupang: ${searchUrl}`);
      try {
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 45000 });
      } catch (gotoError) {
        if (String(gotoError?.message || gotoError).includes('ERR_HTTP2_PROTOCOL_ERROR')) {
          console.warn('⚠️ Coupang HTTP2 error detected, retrying with domcontentloaded wait condition');
          await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
        } else {
          throw gotoError;
        }
      }
      await page.waitForSelector('.search-product', { timeout: 12000 }).catch(() => { });
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => { window.scrollBy({ top: window.innerHeight * 1.3, behavior: 'smooth' }); });
        await page.waitForTimeout(1300 + Math.floor(Math.random() * 700));
      }
      const rawContent = await page.content();
      if (/captcha|자동확인|봇/i.test(rawContent)) throw new Error('Coupang 접근이 제한되었습니다 (봇 의심). 잠시 후 다시 시도해주세요.');
      const $ = cheerio.load(rawContent);
      $('.search-product').each((index, element) => {
        try {
          const $el = $(element);
          const name = $el.find('.name').text().trim();
          const priceText = $el.find('.price-value').text().trim();
          const imageUrl = $el.find('.search-product-wrap img').attr('src');
          const productUrl = 'https://www.coupang.com' + $el.find('a').attr('href');
          if (name && priceText) {
            const price = parseInt(priceText.replace(/[^\d]/g, ''), 10);
            if (Number.isFinite(price) && price >= minPrice && price <= maxPrice) {
              products.push({ name, price, imageUrl: imageUrl ? (imageUrl.startsWith('http') ? imageUrl : 'https:' + imageUrl) : null, sourceUrl: productUrl, site: 'coupang', category: keyword });
            }
          }
        } catch (error) { console.error('Error parsing Coupang product:', error); }
      });
      console.log(`✅ Found ${products.length} products on Coupang`);
    } catch (error) { console.error('❌ Coupang crawling error:', error); throw error; }
    finally { if (page) try { await page.close(); } catch (closeError) { console.warn('⚠️ Failed to close Coupang page:', closeError.message); } }
    return products.slice(0, 40);
  }

  async crawl11st(keyword, minPrice = 0, maxPrice = 1000000) {
    const products = [];
    try {
      await this.init();
      const page = await this.browser.newPage();
      await page.setUserAgent(process.env.USER_AGENT || DEFAULT_USER_AGENT);
      await page.setViewport({ width: 1920, height: 1080 });
      const searchUrl = `https://search.11st.co.kr/Search.tmall?method=getTotalSearchSeller&isGnb=Y&keyword=${encodeURIComponent(keyword)}`;
      console.log(`🔍 Crawling 11st: ${searchUrl}`);
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('.c_prd_item', { timeout: 10000 }).catch(() => { });
      const content = await page.content();
      const $ = cheerio.load(content);
      $('.c_prd_item').each((index, element) => {
        try {
          const $el = $(element);
          const name = $el.find('.pname p').text().trim();
          const priceText = $el.find('.sale_price').text().trim();
          const imageUrl = $el.find('.photo img').attr('src');
          const productUrl = $el.find('.photo a').attr('href');
          if (name && priceText) {
            const price = parseInt(priceText.replace(/[^\d]/g, ''));
            if (price >= minPrice && price <= maxPrice) {
              products.push({ name, price, imageUrl: imageUrl ? (imageUrl.startsWith('http') ? imageUrl : 'https:' + imageUrl) : null, sourceUrl: productUrl ? (productUrl.startsWith('http') ? productUrl : 'https:' + productUrl) : null, site: '11st', category: keyword });
            }
          }
        } catch (error) { console.error('Error parsing 11st product:', error); }
      });
      await page.close();
      console.log(`✅ Found ${products.length} products on 11st`);
    } catch (error) { console.error('❌ 11st crawling error:', error); throw error; }
    return products.slice(0, 20);
  }

  async crawlGmarket(keyword, minPrice = 0, maxPrice = 1000000) {
    const products = [];
    try {
      await this.init();
      const page = await this.browser.newPage();
      await page.setUserAgent(process.env.USER_AGENT || DEFAULT_USER_AGENT);
      await page.setViewport({ width: 1920, height: 1080 });
      const searchUrl = `http://browse.gmarket.co.kr/search?keyword=${encodeURIComponent(keyword)}`;
      console.log(`🔍 Crawling Gmarket: ${searchUrl}`);
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('.box__item-container', { timeout: 10000 }).catch(() => { });
      const content = await page.content();
      const $ = cheerio.load(content);
      $('.box__item-container').each((index, element) => {
        try {
          const $el = $(element);
          const name = $el.find('.text__item').text().trim();
          const priceText = $el.find('.price_innerwrap .price').text().trim();
          const imageUrl = $el.find('.image__item img').attr('src');
          const productUrl = $el.find('.link__item').attr('href');
          if (name && priceText) {
            const price = parseInt(priceText.replace(/[^\d]/g, ''));
            if (price >= minPrice && price <= maxPrice) {
              products.push({ name, price, imageUrl: imageUrl ? (imageUrl.startsWith('http') ? imageUrl : 'https:' + imageUrl) : null, sourceUrl: productUrl ? (productUrl.startsWith('http') ? productUrl : 'https:' + productUrl) : null, site: 'gmarket', category: keyword });
            }
          }
        } catch (error) { console.error('Error parsing Gmarket product:', error); }
      });
      await page.close();
      console.log(`✅ Found ${products.length} products on Gmarket`);
    } catch (error) { console.error('❌ Gmarket crawling error:', error); throw error; }
    return products.slice(0, 20);
  }

  async crawlDomeggook(keyword, minPrice = 0, maxPrice = 1000000) {
    const products = [];
    let page;
    try {
      await this.init();
      page = await this.browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.setUserAgent(process.env.USER_AGENT || DEFAULT_USER_AGENT);

      // 최적화 적용
      await this.optimizePage(page);

      console.log(`🔍 Crawling Domeggook for: ${keyword}`);
      // domcontentloaded로 충분 (networkidle2는 너무 느림)
      await page.goto('https://www.domeggook.com/main', { waitUntil: 'domcontentloaded', timeout: 30000 });

      const inputSelector = '#searchWordForm, input[name="searchword"], input#searchWord';
      await page.waitForSelector(inputSelector, { timeout: 10000 }); // 타임아웃 단축
      await page.type(inputSelector, keyword);

      await Promise.all([
        page.keyboard.press('Enter'),
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(e => console.warn('Nav wait ignored:', e.message))
      ]);

      try { await page.waitForSelector('ol.lItemList > li', { timeout: 15000 }); } catch (error) { console.warn(`Domeggook selector wait warning: ${error.message}`); }
      const scrapedProducts = await page.$$eval(
        'ol.lItemList > li',
        (items, { keyword, minPrice, maxPrice }) => {
          const normalizePrice = (text) => { if (!text) return null; const numeric = parseInt(text.replace(/[^0-9]/g, ''), 10); return Number.isNaN(numeric) ? null : numeric; };
          const addPrefix = (value, prefix) => { if (!value) return null; return value.startsWith('http') ? value : `${prefix}${value.replace(/^\/+/, '')}`; };
          const parseNumber = (text) => { if (!text) return null; const numeric = parseInt(text.replace(/[^0-9]/g, ''), 10); return Number.isNaN(numeric) ? null : numeric; };
          return items.slice(0, 30).map(item => {
            const titleEl = item.querySelector('a.title');
            const priceEl = item.querySelector('div.amtqty.amtQtyMargin > div.amt > b');
            const imgEl = item.querySelector('a.thumb img');
            const unitQtyEl = item.querySelector('div.amtqty.amtQtyMargin .unitQty');
            const shippingEl = item.querySelector('div.amtqty.amtQtyMargin .infoDeli');
            const name = titleEl?.textContent?.trim();
            const priceText = priceEl?.textContent?.trim();
            const numericPrice = normalizePrice(priceText);
            const rawHref = titleEl?.getAttribute('href') || null;
            const normalizedHref = addPrefix(rawHref, 'https://www.domeggook.com/');
            const productNoMatch = (normalizedHref || '').match(/(?:no=|itemno=|itemNo=)(\d{4,})/i);
            const productNo = productNoMatch ? productNoMatch[1] : null;
            if (!name || numericPrice === null) return null;
            if (numericPrice < minPrice || numericPrice > maxPrice) return null;
            return {
              name, price: numericPrice, priceText,
              imageUrl: addPrefix(imgEl?.getAttribute('src') || null, 'https://cdn1.domeggook.com/'),
              sourceUrl: normalizedHref, productNo,
              optionPopupUrl: productNo ? `https://domeggook.com/main/popup/item/popup_itemOptionView.php?no=${productNo}&market=dome` : null,
              site: 'domeggook', category: keyword, currency: 'KRW',
              minOrderQuantity: parseNumber(unitQtyEl?.textContent) || 1,
              shippingCost: parseNumber(shippingEl?.textContent) || 0,
              shippingText: shippingEl?.textContent?.trim() || null
            };
          }).filter(Boolean);
        },
        { keyword, minPrice, maxPrice }
      );
      scrapedProducts.sort((a, b) => a.price - b.price);
      products.push(...scrapedProducts.slice(0, 20));
      console.log(`✅ Found ${products.length} products on Domeggook`);
    } catch (error) { console.error('❌ Domeggook crawling error:', error); throw error; }
    finally { if (page) await page.close(); }
    return products;
  }

  async crawlAllSites(keyword, minPrice = 0, maxPrice = 1000000, sites = ['domeggook']) {
    const startTime = Date.now();
    const allProducts = [];
    const errors = [];
    this.isRunning = true;
    try {
      console.log(`🚀 Starting crawl for keyword: "${keyword}", price: ${minPrice}-${maxPrice}`);
      const crawlPromises = [];
      if (sites.includes('domeggook')) {
        crawlPromises.push(this.crawlDomeggook(keyword, minPrice, maxPrice).catch(err => { errors.push({ site: 'domeggook', error: err.message }); return []; }));
      }
      if (sites.includes('coupang')) {
        crawlPromises.push(this.crawlCoupang(keyword, minPrice, maxPrice).catch(err => { errors.push({ site: 'coupang', error: err.message }); return []; }));
      }
      if (sites.includes('11st')) {
        crawlPromises.push(this.crawl11st(keyword, minPrice, maxPrice).catch(err => { errors.push({ site: '11st', error: err.message }); return []; }));
      }
      if (sites.includes('gmarket')) {
        crawlPromises.push(this.crawlGmarket(keyword, minPrice, maxPrice).catch(err => { errors.push({ site: 'gmarket', error: err.message }); return []; }));
      }
      const results = await Promise.all(crawlPromises);
      results.forEach(siteProducts => { allProducts.push(...siteProducts); });
      console.log(`✅ Crawling completed. Found ${allProducts.length} total products in ${Date.now() - startTime}ms`);
    } catch (error) { console.error('❌ Crawling error:', error); errors.push({ site: 'general', error: error.message }); }
    finally { this.isRunning = false; }
    return { products: allProducts, totalFound: allProducts.length, errors, duration: Date.now() - startTime, keyword, priceRange: { min: minPrice, max: maxPrice } };
  }

  getStatus() { return { isRunning: this.isRunning, browserActive: !!this.browser }; }

  normalizeDomeggookUrl(url) {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    if (/^data:/i.test(trimmed)) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('//')) return `https:${trimmed}`;
    return `https://www.domeggook.com/${trimmed.replace(/^\/+/, '')}`;
  }

  extractDomeItemNo(input) {
    if (!input) return null;
    const s = String(input);
    const m = s.match(/(?:no=|itemno=|itemNo=)(\d{4,})/i);
    if (m) return m[1];
    const k = s.match(/상품번호\s*[:：]?\s*([0-9]{4,})/);
    return k ? k[1] : null;
  }

  // ▼▼▼ [옵션 크롤링 핵심 함수 개선 (테이블형 추가)] ▼▼▼
  async fetchOptionsFromPopup(productNo) {
    if (!productNo) return [];
    let page = null;
    try {
      await this.init();
      page = await this.browser.newPage();

      // 최적화 적용
      await this.optimizePage(page);

      const popupUrl = `https://domeggook.com/main/popup/item/popup_itemOptionView.php?no=${productNo}&market=dome`;
      console.log(`🛠 [Option Popup] Visiting: ${popupUrl}`);

      // 1. Navigation Timeout 에러 무시하고 일단 로딩 시도 (중요)
      try {
        await page.goto(popupUrl, { waitUntil: 'domcontentloaded', timeout: 8000 });
      } catch (navErr) {
        console.warn(`[Option Popup] Navigation warning (will proceed): ${navErr.message}`);
      }

      // await page.waitForTimeout(1000); // 렌더링 대기 -> 제거 (domcontentloaded면 충분할 수 있음)

      const html = await page.content();
      const $ = cheerio.load(html);
      const values = [];

      // 1. 테이블 형태 옵션 (itemOptAllViewTable) - 사용자 요청
      const $table = $('#itemOptAllViewTable');
      if ($table.length) {
        // 헤더에서 옵션명 추출 (2번째 TH가 '색상' 등 옵션명인 경우가 많음)
        const optionName = $table.find('thead th').eq(1).text().trim() || '옵션';

        $table.find('tbody tr').each((_, tr) => {
          const $tds = $(tr).find('td');
          if ($tds.length >= 4) {
            // 2번째 TD: 옵션값 (예: 옐로우골드10구)
            let optVal = $tds.eq(1).text().trim();
            // 3번째 TD: 가격 (추가금 있으면 괄호 안에)
            const priceText = $tds.eq(2).text().trim();
            // 4번째 TD: 재고수량
            const stockText = $tds.eq(3).text().trim();
            const stock = parseInt(stockText.replace(/,/g, ''), 10) || 0;

            // 품절 처리 (판매종료 텍스트 또는 재고 0)
            if (optVal.includes('판매종료') || stock <= 0) {
              optVal += ' (품절)';
            }

            // 추가금 처리
            const extraPriceMatch = priceText.match(/\(\+([\d,]+)원\)/);
            if (extraPriceMatch) {
              optVal += ` (+${extraPriceMatch[1]}원)`;
            }

            if (optVal) values.push(optVal);
          }
        });
      }

      // 2. 버튼 형태 (최신 UI)
      if (values.length === 0) {
        $('.pSelectUIMenu button, .pSelectUIBtn').each((_, el) => {
          const txt = $(el).text().replace(/\s+/g, ' ').trim();
          if (txt) values.push(txt);
        });
      }

      // 3. Select 박스 형태 (드롭다운)
      if (values.length === 0) {
        $('select[name^="op"] option, select.lSelect option').each((_, el) => {
          const txt = $(el).text().replace(/\s+/g, ' ').trim();
          if (txt && !/^선택/i.test(txt)) values.push(txt);
        });
      }

      // 4. 리스트 형태 (구형 UI)
      if (values.length === 0) {
        $('.pSelectUIMenu li').each((_, el) => {
          const txt = $(el).text().replace(/\s+/g, ' ').trim();
          if (txt) values.push(txt);
        });
      }

      const unique = Array.from(new Set(values)).slice(0, 100);

      if (unique.length === 0) {
        const bodyPreview = $('body').text().replace(/\s+/g, ' ').slice(0, 200);
        console.log(`⚠️ [Option Popup] No options found. Page text preview: "${bodyPreview}"`);
      } else {
        console.log(`✅ [Option Popup] Extracted ${unique.length} options:`, unique.slice(0, 3));
      }

      return unique.length ? [{ name: '옵션', type: 'select', values: unique }] : [];
    } catch (err) {
      console.warn(`[dome-options-popup-fail] ProductNo: ${productNo}, Error: ${err.message}`);
      return [];
    } finally {
      if (page) try { await page.close(); } catch (e) { }
    }
  }

  async enrichDomeggookProduct(product) {
    if (!product?.sourceUrl) {
      return { ...product, detailImages: [], imageUsageText: null, imageUsageStatus: 'unknown' };
    }

    let detailPage = null;

    try {
      await this.init();
      detailPage = await this.browser.newPage();
      await detailPage.setViewport({ width: 1280, height: 1600 });
      await detailPage.setUserAgent(process.env.USER_AGENT || DEFAULT_USER_AGENT);

      // 최적화 적용 (상세페이지는 이미지가 필요할 수 있으나, 여기서 추출하는건 HTML 파싱 위주이므로 일단 차단 후 img 태그 src만 가져옴)
      // 주의: 만약 JS로 이미지를 렌더링한다면 이미지가 안 뜰 수 있음. 도매꾹은 SSR에 가까우므로 차단해도 됨.
      // 하지만 상세 이미지를 다운로드 받아야 한다면 block하면 안됨. 
      // 여기서는 'URL'만 따오는 것이므로 block해도 됨.
      await this.optimizePage(detailPage);

      await detailPage.goto(product.sourceUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await detailPage.waitForSelector('#lInfoViewItemContents', { timeout: 10000 }).catch(() => { });
      // await detailPage.waitForTimeout(800);

      const containerHtml = await detailPage
        .$eval('#lInfoViewItemContents', el => el.innerHTML)
        .catch(() => null);

      const fullHtml = await detailPage.content();
      const $full = cheerio.load(fullHtml);

      // ▼▼▼ 상품번호 추출 로직 개선 (Cheerio 사용) ▼▼▼
      let scrapedProductNo = null;
      // 1순위: #lInfoHeader 전체 텍스트에서 번호 추출
      const infoHeaderRaw = $full('#lInfoHeader').text();
      // 로그: 추출한 헤더 텍스트 확인
      console.log(`[debug-crawler] Header Text: "${infoHeaderRaw.trim().slice(0, 50)}..."`);

      const noMatch = infoHeaderRaw.match(/상품번호\s*[:：]?\s*(\d+)/);
      if (noMatch) {
        scrapedProductNo = noMatch[1];
      }

      // 2순위: 헤더에서 못 찾거나, 찾아낸 번호가 너무 짧으면(오탐) URL 등에서 재시도
      if (!scrapedProductNo || scrapedProductNo.length < 5) {
        console.warn(`[debug-crawler] Suspicious ProductNo "${scrapedProductNo}". Retrying extraction...`);
        scrapedProductNo =
          product.productNo ||
          this.extractDomeItemNo(fullHtml) ||
          this.extractDomeItemNo(product.sourceUrl);
      }

      console.log(`[debug-crawler] Final ProductNo: ${scrapedProductNo}`);
      // ▲▲▲ 수정 끝 ▲▲▲

      const thumbSrc = await detailPage.$eval('#lThumbImg', img => img.getAttribute('src')).catch(() => null);
      const normalizedThumb = this.normalizeDomeggookUrl(thumbSrc);

      const detailContent = this.extractDetailContent(containerHtml);

      const imageUsageText = this.extractImageUsageText($full);
      const imageUsageStatus = this.parseImageUsageStatus(imageUsageText);
      const supplierInfo = this.extractSupplierInfo($full);

      const domItemNo = scrapedProductNo;

      // ▼▼▼ 옵션 추출 로직 ▼▼▼
      let options = this.extractOptionsFromDocument($full);
      // 상품번호가 유효한지(5자리 이상) 확인 후 옵션 팝업 호출 (클릭 대신 URL 접속)
      if ((!options || options.length === 0) && domItemNo && domItemNo.length >= 5) {
        const popupOptions = await this.fetchOptionsFromPopup(domItemNo);
        if (popupOptions.length) options = popupOptions;
      }

      const fallbackDescription = `${product.site ? product.site.toUpperCase() : '도매'} 소싱 상품`;
      const description = (detailContent.text || product.description || fallbackDescription || '').trim() || fallbackDescription;
      const detailImagesRaw = detailContent.images.length ? detailContent.images : this.extractDetailImagesFromDocument($full);
      const detailImages = normalizedThumb ? [normalizedThumb, ...detailImagesRaw] : detailImagesRaw;
      const primaryImage = product.imageUrl || product.image || product.thumbUrl || normalizedThumb || null;

      return {
        ...product,
        imageUrl: primaryImage,
        detailImages,
        detailHtml: detailContent.html,
        detailText: detailContent.text,
        description,
        imageUsageText,
        imageUsageStatus,
        productNo: domItemNo || null,
        optionPopupUrl: domItemNo
          ? `https://domeggook.com/main/popup/item/popup_itemOptionView.php?no=${domItemNo}&market=dome`
          : null,
        options,
        supplierName: supplierInfo.supplierName || null,
        supplierContact: supplierInfo.supplierContact || null,
        supplierEmail: supplierInfo.supplierEmail || null,
        supplierAddress: supplierInfo.supplierAddress || null,
        supplierBizNo: supplierInfo.supplierBizNo || null
      };
    } catch (error) {
      console.warn(`⚠️ Failed to enrich Domeggook product: ${error.message}`);
      return {
        ...product,
        detailImages: [],
        imageUsageText: null,
        imageUsageStatus: 'unknown'
      };
    } finally {
      if (detailPage) {
        try {
          await detailPage.close();
        } catch (closeErr) {
          console.warn('⚠️ Failed to close detail page:', closeErr.message);
        }
      }
    }
  }

  extractDetailContent(containerHtml) {
    if (!containerHtml) {
      return { html: null, text: null, images: [] };
    }

    const $content = cheerio.load(containerHtml, { decodeEntities: false });
    const images = new Set();
    const self = this;

    $content('script, style, iframe, noscript, link').remove();
    $content('[onclick], [onload]').each(function () {
      $content(this).removeAttr('onclick').removeAttr('onload');
    });
    $content('[style*="display:none"], [style*="visibility:hidden"]').remove();

    $content('img').each(function () {
      const $img = $content(this);
      const src =
        $img.attr('src') ||
        $img.attr('data-src') ||
        $img.attr('data-original') ||
        $img.attr('data-lazy');
      const normalized = self.normalizeDomeggookUrl(src);
      if (normalized) {
        images.add(normalized);
        $img.attr('src', normalized);
      }
      const existingStyle = $img.attr('style') || '';
      const styleFragments = new Set(
        existingStyle
          .split(';')
          .map(s => s.trim())
          .filter(Boolean)
      );
      styleFragments.add('max-width:100%');
      styleFragments.add('height:auto');
      $img.attr('style', Array.from(styleFragments).join('; '));

      ['data-src', 'data-original', 'data-lazy', 'onload', 'onclick'].forEach(attr =>
        $img.removeAttr(attr)
      );
    });

    $content('a').each(function () {
      const $a = $content(this);
      const href = $a.attr('href');
      if (!href) return;
      if (/^javascript:/i.test(href)) {
        $a.removeAttr('href');
        return;
      }
      const normalized = self.normalizeDomeggookUrl(href);
      if (normalized) {
        $a.attr('href', normalized);
      }
    });

    const sanitizedHtml = ($content.html() || '').trim() || null;

    const textExtractor = cheerio.load(sanitizedHtml || '', { decodeEntities: true });
    textExtractor('br').replaceWith('\n');
    const plainText = textExtractor.root().text();
    const text = plainText
      .replace(/\r/g, '')
      .replace(/\u00a0/g, ' ')
      .split('\n')
      .map(line => line.trim())
      .filter((line, idx, arr) => line !== '' || (idx > 0 && arr[idx - 1] !== ''))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return {
      html: sanitizedHtml,
      text: text || null,
      images: Array.from(images).slice(0, 50)
    };
  }

  extractDetailImagesFromDocument($detail) {
    const images = new Set();

    $detail('img').each((_, el) => {
      const $img = $detail(el);
      const candidates = [
        $img.attr('data-src'),
        $img.attr('data-original'),
        $img.attr('data-lazy'),
        $img.attr('src')
      ];

      for (const candidate of candidates) {
        const normalized = this.normalizeDomeggookUrl(candidate);
        if (!normalized) continue;
        if (!/\.(jpe?g|png|gif|webp|bmp)$/i.test(normalized)) continue;
        if (normalized.includes('logo') || normalized.includes('icon')) continue;
        images.add(normalized);
        break;
      }
    });

    return Array.from(images).slice(0, 30);
  }

  extractSupplierInfo($doc) {
    const info = {};
    const debugRows = [];

    // lTbl 뿐만 아니라 lInfoViewTbl 등 다른 테이블 클래스도 시도
    $doc('table.lTbl tr, table.lInfoViewTbl tr').each((_, tr) => {
      const $tr = $doc(tr);
      const $th = $tr.find('th').first();
      const $tds = $tr.find('td');

      if (!$th.length || !$tds.length) return;

      const key = $th.text().replace(/\s+/g, ' ').trim();
      const val = $tds.map((i, el) => $doc(el).text().replace(/\s+/g, ' ').trim()).get().join(' ');

      if (!key || !val) return;
      debugRows.push({ key, val });

      if (/공급사|판매자/i.test(key)) info.supplierName = val;
      if (/문의|연락처|전화/i.test(key)) info.supplierContact = val;
      if (/이메일/i.test(key)) info.supplierEmail = val;
      if (/주소|소재지/i.test(key)) info.supplierAddress = val;
      if (/등록번호/i.test(key)) info.supplierBizNo = val;

      if (!info.supplierZip) {
        const zipMatch = val.match(/\[(\d{5,6})\]/) || val.match(/\b(\d{5,6})\b/);
        if (zipMatch) info.supplierZip = zipMatch[1];
      }
    });

    if (!info.supplierName) {
      const btnName = $doc('#lBtnShowSellerInfo b').first().text().trim();
      if (btnName) info.supplierName = btnName;
    }

    if (info.supplierContact && info.supplierContact.includes('*')) {
      console.warn('⚠️ [크롤러] 공급사 연락처가 마스킹(*) 되어 있습니다. 도매꾹 로그인이 필요합니다.');
    }

    console.info('[crawler-supplier-debug]', { rows: debugRows, parsed: info });

    return info;
  }

  extractImageUsageText($detail) {
    const directLabel = $detail('td.lInfoViewSubTd1')
      .filter((_, el) => {
        const text = $detail(el).text().replace(/\s+/g, ' ').trim();
        return /상세\s*설명\s*이미지\s*사용\s*여부/i.test(text);
      })
      .first();

    if (directLabel.length) {
      const valueTd = directLabel.next('td.lInfoViewSubTd2');
      const valueText = valueTd.text().replace(/\s+/g, ' ').trim();
      if (valueText) {
        return `상세설명 이미지 사용여부: ${valueText}`;
      }
      const emphasized = valueTd.find('b, strong, span').text().replace(/\s+/g, ' ').trim();
      if (emphasized) {
        return `상세설명 이미지 사용여부: ${emphasized}`;
      }
    }

    const fallbackBox = $detail('.lInfoViewImgUse').first();
    if (fallbackBox.length) {
      const text = fallbackBox.text().replace(/\s+/g, ' ').trim();
      if (text) {
        return `상세설명 이미지 사용여부: ${text}`;
      }
    }

    let usageText = null;

    $detail('table').each((_, table) => {
      const $table = $detail(table);
      $table.find('th').each((__, th) => {
        const header = $detail(th).text().replace(/\s+/g, ' ').trim();
        if (!header || !/이미지|상세\s*이미지|이미지\s*사용/i.test(header)) {
          return;
        }
        const value = $detail(th).next('td').text().replace(/\s+/g, ' ').trim();
        if (value) {
          usageText = `${header}: ${value}`;
        }
      });
    });

    if (usageText) {
      return usageText;
    }

    const bodyText = $detail('body').text().replace(/\s+/g, ' ').trim();
    const match = bodyText.match(/이미지[^\.]{0,60}(사용\s*(?:가능|불가|제공|제한|무료|유료|허용)[^\.]{0,40})/i);
    if (match) {
      return match[0];
    }

    return null;
  }

  parseImageUsageStatus(text) {
    if (!text) return 'unknown';

    const normalized = text.replace(/\s+/g, '').toLowerCase();

    if (/불가|제공안됨|제공안함|미제공|제공x|사용불가|불허/.test(normalized)) {
      return 'unavailable';
    }

    if (/가능|제공|사용가능|허용|무료사용|제공됩니다/.test(normalized)) {
      return 'available';
    }

    if (/문의|협의|조건|제한|승인|요청|확인필요/.test(normalized)) {
      return 'review';
    }

    return 'unknown';
  }

  extractOptionsFromDocument($doc) {
    const options = [];

    $doc('select').each((_, sel) => {
      const $sel = $doc(sel);
      const nameAttr = $sel.attr('name') || '';
      const label =
        $sel.prev('label').text().trim() ||
        $sel.closest('th,td,div').find('label').first().text().trim() ||
        nameAttr;
      const values = [];
      $sel.find('option').each((__, opt) => {
        const text = $doc(opt).text().trim();
        if (!text || /^선택|옵션선택/i.test(text)) return;
        values.push(text);
      });
      if (values.length) {
        options.push({
          name: label || '옵션',
          type: 'select',
          values: Array.from(new Set(values)).slice(0, 50)
        });
      }
    });

    $doc('input[type=radio], input[type=checkbox]').each((_, input) => {
      const $input = $doc(input);
      const nameAttr = $input.attr('name') || '';
      const label =
        $input.parent('label').text().trim() ||
        $input.next('label').text().trim() ||
        nameAttr;
      if (!label) return;
      const existing = options.find((o) => o.name === nameAttr);
      if (existing) {
        existing.values.push(label);
      } else {
        options.push({
          name: nameAttr || '옵션',
          type: 'choice',
          values: [label]
        });
      }
    });

    return options.map((o) => ({
      ...o,
      values: Array.from(new Set(o.values)).slice(0, 50)
    }));
  }
}

module.exports = new WebCrawler();
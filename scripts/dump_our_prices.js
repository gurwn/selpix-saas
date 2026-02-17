/**
 * dump_our_prices.js — 우리 쿠팡 활성 상품의 가격 + 핵심 지표 덤프
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '/home/dev/openclaw/.env' });
const { cf } = require('./lib/coupang_api');

const DUMP_PATH = path.join(__dirname, '..', 'data', 'active_products_dump.json');
const OUT_PATH = path.join(__dirname, '..', 'data', 'our_products_detail.json');

async function getProduct(id) {
  const { json } = await cf('GET', `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products/${id}`);
  if (json?.code !== 'SUCCESS') throw new Error(`조회실패 ${id}: ${json?.message}`);
  return json.data;
}

async function main() {
  const dump = JSON.parse(fs.readFileSync(DUMP_PATH, 'utf-8'));
  const actives = dump.filter(p => p.status === '승인완료');
  console.log(`활성 상품 ${actives.length}건 가격 조회 시작...\n`);

  const results = [];
  for (const prod of actives) {
    try {
      const full = await getProduct(prod.pid);
      const items = full.items || [];
      const prices = items.map(it => ({
        itemName: it.itemName,
        originalPrice: it.originalPrice,
        salePrice: it.salePrice,
        unitCount: it.unitCount,
        vendorItemId: it.vendorItemId,
      }));
      const minPrice = Math.min(...prices.map(p => p.salePrice));
      const maxPrice = Math.max(...prices.map(p => p.salePrice));

      const row = {
        pid: prod.pid,
        displayName: full.displayProductName || prod.displayName,
        category: full.displayCategoryCode,
        brand: full.brand || '',
        searchTags: full.searchTags || [],
        itemCount: items.length,
        minPrice,
        maxPrice,
        items: prices,
        sourceUrl: prod.sourceUrl,
      };
      results.push(row);
      console.log(`✅ [${prod.pid}] ${row.displayName} → ₩${minPrice.toLocaleString()}${minPrice !== maxPrice ? '~₩'+maxPrice.toLocaleString() : ''} (${items.length}옵션)`);
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.error(`❌ [${prod.pid}] ${e.message}`);
      results.push({ pid: prod.pid, displayName: prod.displayName, error: e.message });
    }
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 2));
  console.log(`\n📝 저장: ${OUT_PATH} (${results.length}건)`);
}

main().catch(e => { console.error(e); process.exit(1); });

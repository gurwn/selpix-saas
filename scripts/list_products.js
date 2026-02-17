#!/usr/bin/env node
/**
 * 쿠팡 판매자 상품 목록 조회
 * 사용: node list_products.js [검색어] [--all]
 */
const fs = require('fs');
const path = require('path');

// .env 로드
const envText = fs.readFileSync('/home/dev/openclaw/.env', 'utf8');
for (const line of envText.split(/\r?\n/)) {
  if (!line || line.trim().startsWith('#')) continue;
  const idx = line.indexOf('=');
  if (idx === -1) continue;
  const key = line.slice(0, idx).trim();
  let val = line.slice(idx + 1).trim();
  const cidx = val.indexOf(' #');
  if (cidx !== -1) val = val.slice(0, cidx).trim();
  process.env[key] = val;
}

const { cf } = require('./lib/coupang_api');
const VID = process.env.COUPANG_VENDOR_ID;

async function listProducts(keyword, fetchAll) {
  let nextToken = '';
  let allProducts = [];
  
  for (let page = 0; page < 50; page++) {
    const query = `vendorId=${VID}&maxPerPage=50${nextToken ? '&nextToken=' + nextToken : ''}`;
    const apiPath = '/v2/providers/seller_api/apis/api/v1/marketplace/seller-products';
    const { res, json } = await cf('GET', apiPath, null, query);
    
    if (res.status !== 200 || json?.code !== 'SUCCESS') {
      console.error('API 에러:', json?.code, json?.message);
      break;
    }
    
    const products = json?.data || [];
    if (!products.length) break;
    allProducts.push(...products);
    
    nextToken = json?.nextToken || '';
    if (!nextToken || !fetchAll) break;
  }
  
  return allProducts;
}

async function main() {
  const args = process.argv.slice(2);
  const keyword = args.find(a => !a.startsWith('--')) || '';
  const fetchAll = args.includes('--all');
  
  console.log(`쿠팡 상품 목록 조회 (vendorId: ${VID})`);
  if (keyword) console.log(`검색어: "${keyword}"`);
  
  const products = await listProducts(keyword, fetchAll);
  console.log(`\n총 ${products.length}개 상품\n`);
  
  let filtered = products;
  if (keyword) {
    filtered = products.filter(p => {
      const name = (p.sellerProductName || '').toLowerCase();
      return name.includes(keyword.toLowerCase());
    });
    console.log(`"${keyword}" 매칭: ${filtered.length}개\n`);
  }
  
  // 멀티 아이템(옵션) 상품 표시
  const multiItem = filtered.filter(p => (p.items?.length || 0) > 1);
  if (multiItem.length) {
    console.log(`=== 옵션 상품 (items > 1): ${multiItem.length}개 ===`);
    for (const p of multiItem) {
      console.log(`  ${p.sellerProductId} | ${(p.sellerProductName || '').slice(0, 50)} | items: ${p.items.length} | ${p.statusName || ''}`);
    }
    console.log('');
  }
  
  // 전체 목록
  console.log('=== 전체 목록 ===');
  for (const p of filtered) {
    const itemCount = p.items?.length || 0;
    const optTag = itemCount > 1 ? ` [옵션${itemCount}]` : '';
    console.log(`  ${p.sellerProductId} | ${(p.sellerProductName || '').slice(0, 50)} | ${p.statusName || ''}${optTag}`);
  }
  
  // JSON 저장
  const outPath = path.resolve(__dirname, '../data/coupang_product_list.json');
  fs.writeFileSync(outPath, JSON.stringify(filtered, null, 2));
  console.log(`\n저장: ${outPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });

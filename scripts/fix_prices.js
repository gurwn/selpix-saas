#!/usr/bin/env node
/**
 * fix_prices.js — 기존 등록 상품 가격 일괄 재계산
 * BUG FIX: minOrderQuantity 묶음가 → 개당 가격으로 보정
 * 
 * Usage:
 *   node scripts/fix_prices.js --dry-run     # 변경 미리보기
 *   node scripts/fix_prices.js               # 실제 적용 (큐 업데이트)
 *   node scripts/fix_prices.js --apply       # 쿠팡 API 가격 업데이트까지
 */

const fs = require('fs');
const path = require('path');

const QUEUE_PATH = path.join(__dirname, '../data/register_queue.json');
const COUPANG_FEE_RATE = 0.108;

// 카테고리별 가격 배수 (pipeline_sourcing.js와 동일)
const DEFAULT_MULTIPLIER = 2.5;
const CATEGORY_MULTIPLIERS = {
  '전자': 2.0, '디지털': 2.0, '가전': 2.0, '충전기': 2.0, '이어폰': 2.0,
  '문구': 3.0, '사무용품': 3.0, '학용품': 3.0,
  '주방': 2.5, '수납': 2.5, '생활용품': 2.5, '리빙': 2.5,
  '캠핑': 2.3, '등산': 2.3, '스포츠': 2.3,
  '완구': 3.0, '장난감': 3.0,
  '반려동물': 2.8, '펫': 2.8,
};

function getMultiplier(name) {
  const text = (name || '').toLowerCase();
  for (const [cat, mult] of Object.entries(CATEGORY_MULTIPLIERS)) {
    if (text.includes(cat)) return mult;
  }
  return DEFAULT_MULTIPLIER;
}

function roundPrice10(p) {
  // 가격 반올림: 10원 단위 또는 50원 단위
  if (p < 10000) return Math.ceil(p / 100) * 100;
  if (p < 50000) return Math.ceil(p / 500) * 500;
  return Math.ceil(p / 1000) * 1000;
}

const dryRun = process.argv.includes('--dry-run');
const apply = process.argv.includes('--apply');

const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'));

let fixCount = 0;
const fixes = [];

for (const item of queue) {
  if (['deleted', 'skip_invalid', 'error_permanent'].includes(item.status)) continue;
  
  const sourcePrice = item.sourcePrice || item.latestSourcePrice;
  if (!sourcePrice) continue;
  
  const oldSalePrice = item.salePrice;
  const name = item.displayName || item.sellerName || '';
  const multiplier = getMultiplier(name);
  
  // 새로운 개당 가격 계산
  const newSalePrice = roundPrice10(Math.round(sourcePrice * multiplier));
  
  // 가격이 20% 이상 차이나면 수정 대상
  const diff = Math.abs(oldSalePrice - newSalePrice) / oldSalePrice;
  if (diff < 0.2) continue;
  
  const ratio = (oldSalePrice / newSalePrice).toFixed(1);
  
  fixes.push({
    name: name.substring(0, 45),
    status: item.status,
    sourcePrice,
    oldSalePrice,
    newSalePrice,
    multiplier,
    ratio,
    productId: item.productId
  });
  
  if (!dryRun) {
    item.salePrice = newSalePrice;
    item.priceFixedAt = new Date().toISOString();
    item.oldSalePrice = oldSalePrice;
    item.unitCost = sourcePrice;
    item.margin = newSalePrice - sourcePrice - Math.round(newSalePrice * COUPANG_FEE_RATE);
    item.marginRate = Math.round((item.margin / newSalePrice) * 100);
  }
  
  fixCount++;
}

// 결과 출력
console.log(`\n${'='.repeat(80)}`);
console.log(`  가격 수정 대상: ${fixCount}건 ${dryRun ? '(DRY RUN)' : ''}`);
console.log(`${'='.repeat(80)}\n`);

console.log('상품명'.padEnd(45) + ' | 도매꾹  → 기존가    → 수정가  | 배율 | 상태');
console.log('-'.repeat(100));

for (const f of fixes) {
  const srcStr = ('₩' + f.sourcePrice.toLocaleString()).padStart(8);
  const oldStr = ('₩' + f.oldSalePrice.toLocaleString()).padStart(10);
  const newStr = ('₩' + f.newSalePrice.toLocaleString()).padStart(8);
  console.log(
    f.name.padEnd(45) + ' | ' +
    srcStr + ' → ' + oldStr + ' → ' + newStr +
    ' | ' + f.ratio + 'x' +
    ' | ' + f.status
  );
}

if (!dryRun && fixCount > 0) {
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
  console.log(`\n✅ register_queue.json 업데이트 완료 (${fixCount}건)`);
  
  if (apply) {
    console.log('\n⚠️  쿠팡 API 가격 업데이트는 별도 스크립트(update_coupang_products.js)로 실행하세요.');
    console.log('    node scripts/update_coupang_products.js --price-only');
  }
} else if (dryRun) {
  console.log(`\n📋 DRY RUN 완료. 실제 적용하려면: node scripts/fix_prices.js`);
}

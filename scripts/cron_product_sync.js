#!/usr/bin/env node
/**
 * 등록/승인 상품을 도매꾹 기준으로 쿠팡 상품정보(최소수량/가격/상품명) 동기화
 *
 * Usage:
 *   node scripts/cron_product_sync.js
 *   node scripts/cron_product_sync.js --dry-run
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '/home/dev/openclaw/.env' });

const { cf } = require('./lib/coupang_api');
const { roundPrice10 } = require('./lib/image_utils');

const QUEUE_FILE = path.resolve(__dirname, '../data/register_queue.json');
const DOMEGGOOK_API_KEY = process.env.DOMEGGOOK_API_KEY;

const DRY_RUN = process.argv.includes('--dry-run');
const COUPANG_FEE_RATE = 0.108;
const DEFAULT_MULTIPLIER = 2.5;

const CATEGORY_MULTIPLIERS = {
  '전자': 2.0, '디지털': 2.0, '가전': 2.0, '충전기': 2.0, '이어폰': 2.0,
  '문구': 3.0, '사무용품': 3.0, '학용품': 3.0,
  '주방': 2.5, '수납': 2.5, '생활용품': 2.5, '리빙': 2.5,
  '캠핑': 2.3, '등산': 2.3, '스포츠': 2.3,
  '완구': 3.0, '장난감': 3.0,
  '반려동물': 2.8, '펫': 2.8,
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatKst(ts = new Date()) {
  const kst = new Date(ts.getTime() + 9 * 60 * 60 * 1000);
  return `${kst.toISOString().slice(0, 16).replace('T', ' ')} KST`;
}

function formatWon(v) {
  return `₩${Number(v || 0).toLocaleString('ko-KR')}`;
}

function extractDomeggookNo(item) {
  if (item.domeggookProductNo) return String(item.domeggookProductNo);
  const url = item.sourceUrl || '';
  const m = url.match(/domeggook\.com\/(\d+)/);
  return m ? m[1] : null;
}

function parseIntSafe(v, def = 0) {
  if (v === null || v === undefined || v === '') return def;
  const n = parseInt(String(v).replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(n) ? n : def;
}

function parseDomePrice(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  const txt = String(raw);

  const pairMatch = txt.match(/(\d+)\+(\d+)/);
  if (pairMatch) return parseIntSafe(pairMatch[2], 0);

  const firstNum = txt.match(/\d+/);
  if (firstNum) return parseIntSafe(firstNum[0], 0);

  return null;
}

function getMultiplier(categoryOrKeyword, name) {
  const text = `${categoryOrKeyword || ''} ${name || ''}`.toLowerCase();
  for (const [cat, mult] of Object.entries(CATEGORY_MULTIPLIERS)) {
    if (text.includes(cat)) return mult;
  }
  return DEFAULT_MULTIPLIER;
}

function calculateMargin(queueItem, source) {
  const minOrder = Math.max(1, parseIntSafe(source.minOrderQty, 1));
  const sourcePrice = parseIntSafe(source.price, 0);
  const shippingCost = parseIntSafe(source.shippingCost, 0);

  const perUnitCost = sourcePrice + Math.round(shippingCost / minOrder);
  const totalCost = perUnitCost * minOrder;
  const multiplier = getMultiplier(queueItem.category || queueItem.keyword || '', source.name || queueItem.displayName || queueItem.sellerName || '');
  const suggestedRetail = roundPrice10(Math.round(totalCost * multiplier));
  const coupangFee = Math.round(suggestedRetail * COUPANG_FEE_RATE);
  const margin = suggestedRetail - totalCost - coupangFee;
  const marginRate = suggestedRetail > 0 ? Math.round((margin / suggestedRetail) * 100) : 0;

  return {
    salePrice: suggestedRetail,
    unitCost: totalCost,
    margin,
    marginRate,
  };
}

async function getDomeggookItemView(productNo) {
  const url = `https://domeggook.com/ssl/api/?ver=4.1&mode=getItemView&aid=${DOMEGGOOK_API_KEY}&no=${productNo}&om=json`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const raw = await res.json();
    const dg = raw?.domeggook;
    const basis = dg?.basis;
    if (!basis) throw new Error('상품 데이터 없음');

    const price = parseDomePrice(dg?.price?.dome || dg?.price?.price || basis?.price);
    const minOrderQty = parseIntSafe(
      basis?.minOrderQty || basis?.minorderqty || dg?.qty?.domeMoq || basis?.unitQty,
      1
    );
    const shippingCost = parseIntSafe(dg?.deli?.dome?.fee || dg?.deli?.fee, 0);

    return {
      name: basis?.title || '',
      price,
      minOrderQty,
      shippingCost,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function getProduct(productId) {
  const { json } = await cf('GET', `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products/${productId}`);
  if (json?.code !== 'SUCCESS' || !json?.data) {
    throw new Error(`쿠팡 상품 조회 실패: ${json?.message || json?.code || 'unknown'}`);
  }
  return json.data;
}

async function updateProduct(product) {
  const { json } = await cf('PUT', '/v2/providers/seller_api/apis/api/v1/marketplace/seller-products', product);
  if (json?.code !== 'SUCCESS') {
    throw new Error(`쿠팡 상품 업데이트 실패: ${json?.message || json?.code || 'unknown'}`);
  }
  return json;
}

function chooseTargetName(item, sourceName) {
  if (item.optimized === true && item.displayName) return item.displayName;
  return sourceName || item.displayName || item.sellerName || '';
}

// itemName 안에 박힌 수량 텍스트를 MOQ에 맞게 수정
// 예: "비녀 1개" (MOQ=2) → "비녀 2개"
//     "수량:3개" (MOQ=5) → "수량:5개"
//     "(1개)" (MOQ=2) → "(2개)"
function fixQtyInItemName(itemName, moq) {
  if (!itemName || moq <= 1) return itemName;
  return itemName
    .replace(/수량:\d+개/, `수량:${moq}개`)
    .replace(/\((\d+)개\)/, `(${moq}개)`)
    .replace(/\s(\d+)개$/, ` ${moq}개`);
}

function buildReport({ syncedCount, moqChanges, priceChanges, nameChanges, itemNameChanges, unchangedCount, errors }) {
  const lines = [
    `[쿠팡 상품 동기화 리포트] ${formatKst()}`,
    DRY_RUN ? '(DRY RUN)' : '',
    '',
    `✅ 동기화 완료: ${syncedCount}건`,
    `📦 최소수량 변경: ${moqChanges.length}건`,
    ...moqChanges.map(line => `  - ${line}`),
    `💰 가격 변경: ${priceChanges.length}건`,
    ...priceChanges.map(line => `  - ${line}`),
    `📝 상품명 변경: ${nameChanges.length}건`,
    ...nameChanges.map(line => `  - ${line}`),
    `🏷 옵션명 수량 수정: ${itemNameChanges.length}건`,
    ...itemNameChanges.map(line => `  - ${line}`),
    `⏭ 변경없음: ${unchangedCount}건`,
    `❌ 오류: ${errors.length}건`,
    ...errors.map(line => `  - ${line}`),
  ];

  return lines.filter((line, idx) => line !== '' || idx === 0 || idx === 2).join('\n');
}

async function main() {
  if (!DOMEGGOOK_API_KEY) {
    throw new Error('DOMEGGOOK_API_KEY 누락');
  }

  const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
  const targets = queue.filter(item =>
    (item.status === 'registered' || item.status === 'approved') &&
    item.productId
  );

  const moqChanges = [];
  const priceChanges = [];
  const nameChanges = [];
  const itemNameChanges = [];
  const errors = [];

  let syncedCount = 0;
  let unchangedCount = 0;

  for (const item of targets) {
    try {
      const productNo = extractDomeggookNo(item);
      if (!productNo) throw new Error('도매꾹 상품번호 없음');

      const source = await getDomeggookItemView(productNo);
      if (!source?.price || source.price <= 0) {
        throw new Error('도매꾹 가격 조회 실패');
      }

      const coupangProduct = await getProduct(item.productId);
      const items = Array.isArray(coupangProduct.items) ? coupangProduct.items : [];
      if (items.length === 0) throw new Error('쿠팡 상품 items 없음');

      const targetMinQty = Math.max(1, parseIntSafe(source.minOrderQty, 1));
      const marginInfo = calculateMargin(item, source);
      const targetSalePrice = marginInfo.salePrice;

      const currentQueuePrice = parseIntSafe(item.salePrice, 0);
      const priceDiffRate = currentQueuePrice > 0
        ? Math.abs(targetSalePrice - currentQueuePrice) / currentQueuePrice
        : 1;
      const shouldUpdatePrice = priceDiffRate >= 0.1;

      const targetName = chooseTargetName(item, source.name);
      const currentName = coupangProduct.displayProductName || coupangProduct.sellerProductName || '';

      const moqChanged = items.some(it => parseIntSafe(it.minimumQuantity, 1) !== targetMinQty);
      const priceChanged = shouldUpdatePrice;
      const nameChanged = !!targetName && currentName !== targetName;
      const itemNameChanged = items.some(it => fixQtyInItemName(it.itemName, targetMinQty) !== it.itemName);

      if (!moqChanged && !priceChanged && !nameChanged && !itemNameChanged) {
        unchangedCount++;
        await sleep(250);
        continue;
      }

      const oldMoqValues = [...new Set(items.map(it => parseIntSafe(it.minimumQuantity, 1)))].join(',');
      const oldPrice = currentQueuePrice || parseIntSafe(items[0].salePrice, 0);

      const updatedProduct = {
        ...coupangProduct,
        // 노출 상품명만 변경 (SEO 최적화명)
        // 등록 상품명(sellerProductName)은 도매꾹 원본 유지
        displayProductName: nameChanged ? targetName : coupangProduct.displayProductName,
        items: items.map(it => ({
          ...it,
          itemName: fixQtyInItemName(it.itemName, targetMinQty),
          minimumQuantity: moqChanged ? targetMinQty : it.minimumQuantity,
          salePrice: priceChanged ? targetSalePrice : it.salePrice,
          originalPrice: priceChanged ? targetSalePrice : it.originalPrice,
        })),
      };

      if (!DRY_RUN) {
        await updateProduct(updatedProduct);
      }

      const productLabel = targetName || currentName || item.displayName || item.sellerName || String(item.productId);

      if (moqChanged) {
        moqChanges.push(`${productLabel} | MOQ: ${oldMoqValues} → ${targetMinQty}`);
      }
      if (priceChanged) {
        priceChanges.push(`${productLabel} | ${formatWon(oldPrice)} → ${formatWon(targetSalePrice)}`);
      }
      if (nameChanged) {
        nameChanges.push(`${currentName || '(기존명 없음)'} → ${targetName}`);
      }
      if (itemNameChanged) {
        items.forEach(it => {
          const fixed = fixQtyInItemName(it.itemName, targetMinQty);
          if (fixed !== it.itemName) {
            itemNameChanges.push(`${productLabel} | ${it.itemName} → ${fixed}`);
          }
        });
      }

      if (!DRY_RUN) {
        item.domeggookProductNo = item.domeggookProductNo || productNo;
        item.latestSourcePrice = source.price;

        if (moqChanged) {
          item.minOrderQuantity = targetMinQty;
        }
        if (priceChanged) {
          item.salePrice = targetSalePrice;
          item.unitCost = marginInfo.unitCost;
          item.margin = marginInfo.margin;
          item.marginRate = marginInfo.marginRate;
          item.priceSyncedAt = new Date().toISOString();
        }
        if (nameChanged) {
          item.displayName = targetName; // 노출명만 업데이트
          // item.sellerName은 도매꾹 원본 유지
        }
      }

      syncedCount++;
    } catch (e) {
      errors.push(`[${item.productId || 'N/A'}] ${(item.displayName || item.sellerName || '').slice(0, 30)} | ${e.message}`);
    }

    await sleep(250);
  }

  if (!DRY_RUN) {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
  }

  console.log(buildReport({
    syncedCount,
    moqChanges,
    priceChanges,
    nameChanges,
    itemNameChanges,
    unchangedCount,
    errors,
  }));
}

main().catch(err => {
  console.error(`FATAL: ${err.message}`);
  process.exit(1);
});

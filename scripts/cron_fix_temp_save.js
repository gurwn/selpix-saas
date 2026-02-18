#!/usr/bin/env node
/**
 * 임시저장 상품 복구 크론
 *
 * Usage:
 *   node -r dotenv/config scripts/cron_fix_temp_save.js
 *   node -r dotenv/config scripts/cron_fix_temp_save.js --dry-run
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '/home/dev/openclaw/.env' });

const { cf, updateProductFull } = require('./lib/coupang_api');

const QUEUE_FILE = path.resolve(__dirname, '../data/register_queue.json');
const DOMEGGOOK_API_KEY = process.env.DOMEGGOOK_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractDomeggookNo(item) {
  if (item.domeggookProductNo) return String(item.domeggookProductNo);
  const url = item.sourceUrl || '';
  const m = url.match(/domeggook\.com\/(\d+)/);
  return m ? m[1] : null;
}

function parseBool(value) {
  if (typeof value === 'boolean') return value;
  if (value === null || value === undefined) return null;
  const v = String(value).trim().toLowerCase();
  if (['true', '1', 'y', 'yes'].includes(v)) return true;
  if (['false', '0', 'n', 'no'].includes(v)) return false;
  return null;
}

function collectByKey(obj, targetKey, out = []) {
  if (!obj || typeof obj !== 'object') return out;
  for (const [k, v] of Object.entries(obj)) {
    if (k === targetKey) out.push(v);
    if (v && typeof v === 'object') collectByKey(v, targetKey, out);
  }
  return out;
}

function detectOverseasShipping(detail) {
  const deliveryMethod = detail?.domeggook?.deli?.method;
  const fromOversea = detail?.domeggook?.deli?.fromOversea;
  const deliveryTypes = collectByKey(detail, 'deliveryType');
  const isOverseasValues = collectByKey(detail, 'isOverseas');

  const hasOverseasText = [deliveryMethod, ...deliveryTypes]
    .filter(v => v !== null && v !== undefined)
    .map(v => String(v))
    .some(v => /해외배송|해외직배송|overseas/i.test(v));

  const hasOverseasFlag = [...isOverseasValues, fromOversea].some(v => {
    const b = parseBool(v);
    if (b === true) return true;
    if (typeof v === 'string' && v.toLowerCase() === 'overseas') return true;
    return false;
  });

  const isOverseas = hasOverseasText || hasOverseasFlag;
  const reasonParts = [];
  if (deliveryMethod !== null && deliveryMethod !== undefined) {
    reasonParts.push(`method=${deliveryMethod}`);
  }
  if (deliveryTypes.length) {
    reasonParts.push(`deliveryType=${deliveryTypes[0]}`);
  }
  if (fromOversea !== null && fromOversea !== undefined) {
    reasonParts.push(`fromOversea=${fromOversea}`);
  }
  if (isOverseasValues.length) {
    reasonParts.push(`isOverseas=${isOverseasValues[0]}`);
  }

  return {
    isOverseas,
    reason: reasonParts.join(', ') || '배송유형 정보 없음',
  };
}

async function getCoupangStatusName(productId) {
  const { json } = await cf('GET', `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products/${productId}`);
  if (json?.code !== 'SUCCESS' || !json?.data) {
    throw new Error(`쿠팡 상품 조회 실패: ${json?.message || json?.code || 'unknown'}`);
  }
  return json.data.statusName || '';
}

async function getDomeggookDetail(productNo) {
  const url = `https://domeggook.com/ssl/api/?ver=4.1&mode=getItemView&aid=${DOMEGGOOK_API_KEY}&no=${productNo}&om=json`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`도매꾹 API HTTP ${res.status}`);
    const data = await res.json();
    if (!data?.domeggook) {
      throw new Error('도매꾹 상세 데이터 없음');
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function printSection(title, rows) {
  console.log(`${title}: ${rows.length}건`);
  if (rows.length) {
    rows.forEach(r => console.log(`  - ${r}`));
  }
}

async function main() {
  if (!DOMEGGOOK_API_KEY) {
    throw new Error('DOMEGGOOK_API_KEY 누락');
  }

  const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
  const targets = queue.filter(item => item.productId);

  const holdList = [];
  const recoveredList = [];
  const failedList = [];

  let changed = false;

  for (const item of targets) {
    const productId = item.productId;
    const label = `[${productId}] ${(item.displayName || item.sellerName || '').slice(0, 40)}`;

    try {
      const statusName = await getCoupangStatusName(productId);
      if (statusName !== '임시저장') {
        await sleep(150);
        continue;
      }

      const domeggookNo = extractDomeggookNo(item);
      if (!domeggookNo) {
        throw new Error('도매꾹 상품번호 없음');
      }

      const domeggookDetail = await getDomeggookDetail(domeggookNo);
      const shipping = detectOverseasShipping(domeggookDetail);

      if (shipping.isOverseas) {
        holdList.push(`${label} | 도매꾹:${domeggookNo} | ${shipping.reason}`);
        if (!DRY_RUN && item.status !== '보류') {
          item.status = '보류';
          changed = true;
        }
      } else {
        if (DRY_RUN) {
          recoveredList.push(`${label} | 도매꾹:${domeggookNo} | ${shipping.reason} | DRY-RUN`);
        } else {
          const { json } = await updateProductFull(productId, {});
          if (json?.code === 'SUCCESS') {
            recoveredList.push(`${label} | 도매꾹:${domeggookNo}`);
          } else {
            throw new Error(`복구 PUT 실패: ${json?.message || json?.code || 'unknown'}`);
          }
        }
      }
    } catch (e) {
      failedList.push(`${label} | ${e.message}`);
    }

    await sleep(200);
  }

  if (!DRY_RUN && changed) {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
  }

  console.log(`[임시저장 복구] ${DRY_RUN ? '(DRY RUN)' : ''}`.trim());
  printSection('보류 처리', holdList);
  printSection('복구 성공', recoveredList);
  printSection('복구 실패', failedList);
}

main().catch(err => {
  console.error(`FATAL: ${err.message}`);
  process.exit(1);
});

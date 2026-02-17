#!/usr/bin/env node
/**
 * 도매꾹 품절 모니터링 → 쿠팡 자동 판매중지/재개
 *
 * 동작:
 * 1. register_queue.json에서 활성 상품(registered/approved) 조회
 * 2. 도매꾹 API로 재고/판매상태 확인
 * 3. 품절 → 쿠팡 판매중지 (vendor-items/stop)
 * 4. 재입고 → 쿠팡 판매재개 (vendor-items/resume)
 *
 * 크론: 매 6시간 권장
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '/home/dev/openclaw/.env' });

const { cf, cfJson, deleteProduct } = require('./lib/coupang_api');

const QUEUE_FILE = path.resolve(__dirname, '../data/register_queue.json');
const DOMEGGOOK_API_KEY = process.env.DOMEGGOOK_API_KEY;
const LOG_FILE = path.resolve(__dirname, '../data/stock_monitor.log');

/**
 * sourceUrl에서 도매꾹 상품번호 추출
 */
function extractDomeggookNo(item) {
  if (item.domeggookProductNo) return String(item.domeggookProductNo);
  const url = item.sourceUrl || '';
  const m = url.match(/domeggook\.com\/(\d+)/);
  return m ? m[1] : null;
}

/**
 * 도매꾹 상품 상태 조회 (ssl/api v4.1)
 * @returns {{ available: boolean, soldOut: boolean, price: number|null, reason: string }}
 */
async function checkDomeggookStock(productNo) {
  if (!productNo || !DOMEGGOOK_API_KEY) {
    return { available: null, soldOut: false, price: null, reason: 'productNo 또는 API키 없음' };
  }

  try {
    const url = `https://domeggook.com/ssl/api/?ver=4.1&mode=getItemView&aid=${DOMEGGOOK_API_KEY}&no=${productNo}&om=json`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      return { available: null, soldOut: false, price: null, reason: `HTTP ${res.status}` };
    }

    const data = await res.json();
    const basis = data?.domeggook?.basis;
    const priceInfo = data?.domeggook?.price;

    if (!basis) {
      return { available: null, soldOut: false, price: null, reason: '상품 데이터 없음' };
    }

    const saleStatus = basis.status || '';
    const price = priceInfo?.dome ? parseInt(priceInfo.dome) : null;

    // 품절 판단
    const isSoldOut = saleStatus === '품절' || saleStatus === '일시품절';

    // 판매 종료 판단
    const isEnded =
      saleStatus === '판매종료' ||
      saleStatus === '판매중지' ||
      saleStatus === '삭제';

    // 기간 만료 확인
    const dateEnd = basis.dateEnd ? new Date(basis.dateEnd) : null;
    const isExpired = dateEnd && dateEnd < new Date();

    const available = saleStatus === '판매중' && !isExpired;

    return {
      available,
      soldOut: isSoldOut,
      ended: isEnded || isExpired,
      price,
      saleStatus,
      reason: isSoldOut ? '품절' : (isEnded || isExpired) ? `판매종료(${saleStatus})` : '정상',
    };
  } catch (e) {
    return { available: null, soldOut: false, price: null, reason: `에러: ${e.message}` };
  }
}

/**
 * 쿠팡 판매중지 (모든 vendor items)
 */
async function stopCoupangSale(sellerProductId) {
  const { json: detail } = await cf('GET', `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products/${sellerProductId}`);
  if (detail?.code !== 'SUCCESS') return { success: false, message: '조회 실패' };

  const items = detail.data?.items || [];
  let allOk = true;

  for (const item of items) {
    const vid = item.vendorItemId;
    if (!vid) continue;
    const { json } = await cf('PUT', `/v2/providers/seller_api/apis/api/v1/marketplace/vendor-items/${vid}/sales/stop`);
    if (json?.code !== 'SUCCESS') {
      console.log(`  판매중지 실패 [${vid}]: ${json?.message}`);
      allOk = false;
    }
  }

  return { success: allOk, message: allOk ? '판매중지 완료' : '일부 실패' };
}

/**
 * 쿠팡 판매재개 (모든 vendor items)
 */
async function resumeCoupangSale(sellerProductId) {
  const { json: detail } = await cf('GET', `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products/${sellerProductId}`);
  if (detail?.code !== 'SUCCESS') return { success: false, message: '조회 실패' };

  const items = detail.data?.items || [];
  let allOk = true;

  for (const item of items) {
    const vid = item.vendorItemId;
    if (!vid) continue;
    const { json } = await cf('PUT', `/v2/providers/seller_api/apis/api/v1/marketplace/vendor-items/${vid}/sales/resume`);
    if (json?.code !== 'SUCCESS') {
      console.log(`  판매재개 실패 [${vid}]: ${json?.message}`);
      allOk = false;
    }
  }

  return { success: allOk, message: allOk ? '판매재개 완료' : '일부 실패' };
}

function appendLog(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, line);
  console.log(msg);
}

async function main() {
  const now = new Date().toISOString();
  appendLog(`=== 재고 모니터링 시작 ===`);

  if (!DOMEGGOOK_API_KEY) {
    appendLog('FATAL: DOMEGGOOK_API_KEY 누락');
    process.exit(1);
  }

  const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
  const active = queue.filter(i =>
    (i.status === 'registered' || i.status === 'approved' || i.status === 'stock_stopped') &&
    i.productId &&
    (i.domeggookProductNo || i.sourceUrl)
  );

  appendLog(`활성 상품: ${active.length}건`);

  let stopped = 0;
  let resumed = 0;
  let unchanged = 0;
  let errors = 0;

  for (const item of active) {
    const dgNo = extractDomeggookNo(item);
    if (!dgNo) {
      errors++;
      continue;
    }
    // sourceUrl에서 추출한 번호를 저장 (다음 실행 시 재활용)
    if (!item.domeggookProductNo) item.domeggookProductNo = dgNo;

    const stock = await checkDomeggookStock(dgNo);

    if (stock.available === null) {
      // 조회 실패 — 무시
      appendLog(`  ⚠ [${item.productId}] 도매꾹 조회 실패: ${stock.reason} | ${(item.sellerName || '').slice(0, 30)}`);
      errors++;
      continue;
    }

    if (!stock.available && (item.status === 'registered' || item.status === 'approved')) {
      // 품절 → 판매중지
      appendLog(`  🛑 [${item.productId}] 품절 감지: ${stock.reason} | ${(item.sellerName || '').slice(0, 30)}`);
      const result = await stopCoupangSale(item.productId);
      if (result.success) {
        item.status = 'stock_stopped';
        item.stockStoppedAt = now;
        item.stockStopReason = stock.reason;
        stopped++;
        appendLog(`    → 판매중지 완료`);
      } else {
        appendLog(`    → 판매중지 실패: ${result.message}`);
        errors++;
      }
    } else if (stock.available && item.status === 'stock_stopped') {
      // 재입고 → 판매재개
      appendLog(`  🟢 [${item.productId}] 재입고 감지 | ${(item.sellerName || '').slice(0, 30)}`);
      const result = await resumeCoupangSale(item.productId);
      if (result.success) {
        item.status = 'approved'; // 원래 상태로 복구
        item.stockResumedAt = now;
        resumed++;
        appendLog(`    → 판매재개 완료`);
      } else {
        appendLog(`    → 판매재개 실패: ${result.message}`);
        errors++;
      }
    } else {
      unchanged++;
    }

    // 가격 변동 감지 (참고용 로깅)
    if (stock.price && item.salePrice) {
      const sourcePrice = stock.price;
      if (Math.abs(sourcePrice - (item.originalSourcePrice || item.salePrice)) > 500) {
        appendLog(`  💰 [${item.productId}] 도매꾹 가격 변동: ${item.originalSourcePrice || '?'} → ${sourcePrice}`);
        item.latestSourcePrice = sourcePrice;
        item.priceChangedAt = now;
      }
    }

    // rate limit 방지
    await new Promise(r => setTimeout(r, 300));
  }

  // 큐 저장
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));

  appendLog(`\n=== 결과 ===`);
  appendLog(`판매중지: ${stopped} | 재개: ${resumed} | 변동없음: ${unchanged} | 에러: ${errors}`);
}

main().catch(e => { console.error(e); process.exit(1); });

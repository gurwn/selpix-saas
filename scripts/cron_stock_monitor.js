#!/usr/bin/env node
/**
 * 도매꾹 품절 모니터링 → 쿠팡 자동 판매중지/재개
 *
 * 동작:
 * 1. register_queue.json에서 활성 상품(registered/approved) 조회
 * 2. 도매꾹 API로 재고/판매상태 확인
 * 3. 품절 → 쿠팡 판매중지 (vendor-items/stop)
 * 4. 재입고 → 쿠팡 판매재개 (vendor-items/resume)
 * 5. 비정상 가격(100원 이하) 감지 시 seller-product 판매중지 + 중복 경고 방지
 *
 * 크론: 매 6시간 권장
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '/home/dev/openclaw/.env' });

const { cf, cfJson, deleteProduct } = require('./lib/coupang_api');

const QUEUE_FILE = path.resolve(__dirname, '../data/register_queue.json');
const ALERT_STATE_FILE = path.resolve(__dirname, '../data/stock_alert_state.json');
const DOMEGGOOK_API_KEY = process.env.DOMEGGOOK_API_KEY;
const DISCORD_WEBHOOK_URL = process.env.STOCK_ALERT_DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL || '';
const LOG_FILE = path.resolve(__dirname, '../data/stock_monitor.log');
const PRIORITY_STOP_TARGET_IDS = new Set([
  '16041404905',
  '16041439752',
  '16047707374',
  '16047713047',
  '16047625400',
  '16047658790',
  '16047658822',
  '16047659168',
  '16048549154',
  '16048564394',
]);

function getDefaultAlertState() {
  return {
    priceAnomalies: {},
    outOfStock: {},
  };
}

function loadAlertState() {
  const fallback = getDefaultAlertState();

  if (!fs.existsSync(ALERT_STATE_FILE)) {
    fs.writeFileSync(ALERT_STATE_FILE, JSON.stringify(fallback, null, 2));
    return fallback;
  }

  try {
    const raw = JSON.parse(fs.readFileSync(ALERT_STATE_FILE, 'utf-8'));
    return {
      priceAnomalies: raw?.priceAnomalies && typeof raw.priceAnomalies === 'object' ? raw.priceAnomalies : {},
      outOfStock: raw?.outOfStock && typeof raw.outOfStock === 'object' ? raw.outOfStock : {},
    };
  } catch (e) {
    fs.writeFileSync(ALERT_STATE_FILE, JSON.stringify(fallback, null, 2));
    return fallback;
  }
}

function saveAlertState(state) {
  fs.writeFileSync(ALERT_STATE_FILE, JSON.stringify(state, null, 2));
}

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
 * 쿠팡 판매중지 (seller-product 단위)
 * - 문서 요청 경로 우선 시도
 * - 미지원 시 vendor-items 판매중지로 fallback
 */
async function stopCoupangSellerProductSale(sellerProductId) {
  const { json } = await cf('PUT', `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products/sales/stop/${sellerProductId}`);
  if (json?.code === 'SUCCESS') {
    return { success: true, message: '판매중지 완료' };
  }

  const fallback = await stopCoupangSale(sellerProductId);
  if (fallback.success) {
    return {
      success: true,
      message: `seller-product stop API 미지원/실패로 vendor-items fallback 성공 (${json?.code || 'UNKNOWN'})`,
    };
  }

  return {
    success: false,
    message: `${json?.message || json?.code || 'seller-product stop 실패'} | fallback: ${fallback.message}`,
  };
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

async function sendDiscordPriceAnomalyReport(newAnomalies) {
  if (!newAnomalies.length) return;

  if (!DISCORD_WEBHOOK_URL) {
    appendLog(`  ℹ Discord Webhook 미설정 - 신규 이상 ${newAnomalies.length}건은 로그로만 기록`);
    return;
  }

  const lines = [
    `[재고 모니터링] 신규 비정상 가격 감지 ${newAnomalies.length}건`,
    ...newAnomalies.map(a => `- 상품ID ${a.productId} | 도매꾹 ${a.domeggookNo} | 현재가 ${a.price}원`),
  ];

  const content = lines.join('\n').slice(0, 1900);

  try {
    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      appendLog(`  ⚠ Discord 전송 실패: HTTP ${res.status}`);
    }
  } catch (e) {
    appendLog(`  ⚠ Discord 전송 에러: ${e.message}`);
  }
}

async function main() {
  const now = new Date().toISOString();
  appendLog(`=== 재고 모니터링 시작 ===`);

  if (!DOMEGGOOK_API_KEY) {
    appendLog('FATAL: DOMEGGOOK_API_KEY 누락');
    process.exit(1);
  }

  const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
  const alertState = loadAlertState();

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

  const newAnomalyReports = [];
  const priorityStopAttempted = new Set();
  let priorityStopSuccess = 0;
  let priorityStopFail = 0;
  const priorityStopFailReasons = [];

  for (const item of active) {
    const itemKey = String(item.productId);
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

    const sourcePrice = Number.isFinite(Number(stock.price)) ? Number(stock.price) : null;
    const previousNormalPrice = Number(item.lastNormalSourcePrice || item.sourcePrice || item.originalSourcePrice || 0);
    const isPriceAnomaly = sourcePrice !== null && sourcePrice <= 100 && previousNormalPrice >= 1000;

    if (isPriceAnomaly) {
      const existing = alertState.priceAnomalies[itemKey];
      if (!existing) {
        alertState.priceAnomalies[itemKey] = {
          reportedAt: now,
          domeggookNo: dgNo,
          anomalyPrice: sourcePrice,
        };
        newAnomalyReports.push({
          productId: item.productId,
          domeggookNo: dgNo,
          price: sourcePrice,
        });
      } else {
        existing.domeggookNo = dgNo;
        existing.anomalyPrice = sourcePrice;
      }

      appendLog(`  ⚠️ [${item.productId}] 비정상 가격 감지: ${previousNormalPrice} → ${sourcePrice} (품절 의심)`);

      if (item.status === 'registered' || item.status === 'approved') {
        appendLog(`  🛑 [${item.productId}] 비정상 가격으로 판매중지 시도 | ${(item.sellerName || '').slice(0, 30)}`);
        const result = await stopCoupangSellerProductSale(item.productId);

        if (PRIORITY_STOP_TARGET_IDS.has(itemKey) && !priorityStopAttempted.has(itemKey)) {
          priorityStopAttempted.add(itemKey);
          if (result.success) {
            priorityStopSuccess++;
          } else {
            priorityStopFail++;
            priorityStopFailReasons.push(`[${itemKey}] ${result.message}`);
          }
        }

        if (result.success) {
          item.status = 'stock_stopped';
          item.stockStoppedAt = now;
          item.stockStopReason = `비정상가격(${sourcePrice}원)`;
          alertState.outOfStock[itemKey] = {
            stoppedAt: now,
            domeggookNo: dgNo,
          };
          stopped++;
          appendLog(`    → 판매중지 완료`);
        } else {
          appendLog(`    → 판매중지 실패: ${result.message}`);
          errors++;
        }
      } else {
        unchanged++;
      }
    } else {
      if (sourcePrice !== null && sourcePrice > 100 && alertState.priceAnomalies[itemKey]) {
        delete alertState.priceAnomalies[itemKey];
        appendLog(`  ✅ [${item.productId}] 비정상 가격 해소: ${sourcePrice}원 (anomaly 해제)`);
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
    }

    // 가격 변동 감지 (10% 이상) — 실제 쿠팡 가격 반영은 cron_product_sync.js에서 처리
    if (sourcePrice !== null) {
      if (sourcePrice > 100) {
        item.lastNormalSourcePrice = sourcePrice;
      }

      const baseline = Number(item.latestSourcePrice || item.sourcePrice || item.originalSourcePrice || 0);

      if (baseline > 0) {
        const changeRate = Math.abs(sourcePrice - baseline) / baseline;
        if (changeRate >= 0.1) {
          const pct = (changeRate * 100).toFixed(1);
          appendLog(`  ⚠️ [${item.productId}] 도매꾹 가격 ${pct}% 변동: ${baseline} → ${sourcePrice} (가격 동기화 필요)`);
          item.latestSourcePrice = sourcePrice;
          item.priceChangedAt = now;
        }
      } else {
        // 기준가가 없으면 현재 소싱가를 기준값으로 저장
        item.latestSourcePrice = sourcePrice;
      }
    }

    // rate limit 방지
    await new Promise(r => setTimeout(r, 300));
  }

  // 우선 대상 10건은 반드시 즉시 판매중지 시도
  const queueByProductId = new Map(queue.map(item => [String(item.productId), item]));
  for (const targetId of PRIORITY_STOP_TARGET_IDS) {
    if (priorityStopAttempted.has(targetId)) continue;

    const targetItem = queueByProductId.get(targetId);
    if (!targetItem) {
      priorityStopFail++;
      priorityStopFailReasons.push(`[${targetId}] register_queue에 없음`);
      priorityStopAttempted.add(targetId);
      continue;
    }

    if (targetItem.status === 'stock_stopped' || alertState.outOfStock[targetId]) {
      priorityStopAttempted.add(targetId);
      continue;
    }

    const dgNo = extractDomeggookNo(targetItem) || String(targetItem.domeggookProductNo || '');
    appendLog(`  🛑 [${targetId}] 우선대상 판매중지 추가 시도`);

    const result = await stopCoupangSellerProductSale(targetId);
    priorityStopAttempted.add(targetId);

    if (result.success) {
      priorityStopSuccess++;
      targetItem.status = 'stock_stopped';
      targetItem.stockStoppedAt = now;
      targetItem.stockStopReason = targetItem.stockStopReason || '비정상가격 우선중지';
      if (dgNo) {
        alertState.outOfStock[targetId] = {
          stoppedAt: now,
          domeggookNo: dgNo,
        };
      }
      stopped++;
      appendLog(`    → 우선대상 판매중지 완료`);
    } else {
      priorityStopFail++;
      priorityStopFailReasons.push(`[${targetId}] ${result.message}`);
      appendLog(`    → 우선대상 판매중지 실패: ${result.message}`);
    }

    await new Promise(r => setTimeout(r, 300));
  }

  // 큐/상태 저장
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
  saveAlertState(alertState);

  // 신규 이상만 Discord 보고
  await sendDiscordPriceAnomalyReport(newAnomalyReports);

  appendLog(`\n=== 결과 ===`);
  appendLog(`판매중지: ${stopped} | 재개: ${resumed} | 변동없음: ${unchanged} | 에러: ${errors}`);
  appendLog(`우선대상 10건 판매중지 시도: 성공 ${priorityStopSuccess}건 / 실패 ${priorityStopFail}건`);
  if (priorityStopFailReasons.length) {
    appendLog(`우선대상 실패 사유: ${priorityStopFailReasons.join(' | ')}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });

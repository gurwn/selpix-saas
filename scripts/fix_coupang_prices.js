const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '/home/dev/openclaw/.env' });

const { cf } = require('./lib/coupang_api');

const QUEUE_PATH = path.join(__dirname, '..', 'data', 'register_queue.json');
const LOG_PATH = path.join(__dirname, '..', 'data', 'price_fix_log.json');

const BATCH_SIZE = 5;
const DELAY_MS = 2000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function loadQueue() {
  const raw = fs.readFileSync(QUEUE_PATH, 'utf8');
  return JSON.parse(raw);
}

function filterTargets(list) {
  return list.filter(item => {
    const statusOk = item.status === 'registered' || item.status === 'approved';
    return statusOk && item.priceFixedAt && item.productId;
  });
}

async function getProduct(id) {
  const pathUrl = `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products/${id}`;
  const { json } = await cf('GET', pathUrl);
  if (json?.code !== 'SUCCESS' || !json?.data) {
    throw new Error(`상품 조회 실패(${id}): ${json?.message || JSON.stringify(json)}`);
  }
  return json.data;
}

async function updateProduct(product) {
  const pathUrl = `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products`;
  return cf('PUT', pathUrl, product);
}

async function updatePrice({ productId, salePrice, oldSalePrice }) {
  const start = Date.now();
  let detail;
  try {
    detail = await getProduct(productId);
  } catch (e) {
    return {
      success: false,
      stage: 'fetch',
      productId,
      salePrice,
      oldSalePrice,
      durationMs: Date.now() - start,
      error: e.message,
    };
  }

  const newPrice = Number(salePrice);
  if (!Number.isFinite(newPrice) || newPrice <= 0) {
    return {
      success: false,
      stage: 'validate',
      productId,
      salePrice,
      oldSalePrice,
      durationMs: Date.now() - start,
      error: '잘못된 salePrice',
    };
  }

  const items = Array.isArray(detail.items) ? detail.items : [];
  if (!items.length) {
    return {
      success: false,
      stage: 'validate',
      productId,
      salePrice,
      oldSalePrice,
      durationMs: Date.now() - start,
      error: '상품 items 없음',
    };
  }

  const updatedItems = items.map(it => ({
    ...it,
    originalPrice: newPrice,
    salePrice: newPrice,
  }));

  const payload = { ...detail, items: updatedItems };

  try {
    const { res, json } = await updateProduct(payload);
    const success = json?.code === 'SUCCESS';
    return {
      success,
      stage: 'update',
      productId,
      salePrice: newPrice,
      oldSalePrice,
      durationMs: Date.now() - start,
      httpStatus: res?.status,
      code: json?.code,
      message: json?.message,
      response: json,
    };
  } catch (e) {
    return {
      success: false,
      stage: 'update',
      productId,
      salePrice: newPrice,
      oldSalePrice,
      durationMs: Date.now() - start,
      error: e.message,
    };
  }
}

function appendLog(runLog) {
  let existing = [];
  if (fs.existsSync(LOG_PATH)) {
    try {
      existing = JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'));
      if (!Array.isArray(existing)) existing = [];
    } catch (e) {
      existing = [];
    }
  }
  existing.push(runLog);
  fs.writeFileSync(LOG_PATH, JSON.stringify(existing, null, 2));
}

async function main() {
  const queue = loadQueue();
  const targets = filterTargets(queue);
  console.log(`총 대상: ${targets.length}건`);

  let successCount = 0;
  let failureCount = 0;
  const results = [];

  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE);
    console.log(`배치 처리 ${i + 1} ~ ${i + batch.length}`);
    for (const entry of batch) {
      const result = await updatePrice(entry);
      if (result.success) successCount++; else failureCount++;
      results.push(result);
      console.log(`- productId ${entry.productId}: ${result.success ? 'SUCCESS' : 'FAIL'} ${result.message || result.error || ''}`);
      await sleep(DELAY_MS);
    }
  }

  const runLog = {
    runAt: new Date().toISOString(),
    total: targets.length,
    success: successCount,
    failure: failureCount,
    results,
  };

  appendLog(runLog);
  console.log('완료', { successCount, failureCount });
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

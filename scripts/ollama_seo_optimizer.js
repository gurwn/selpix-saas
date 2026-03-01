#!/usr/bin/env node
/**
 * ollama_seo_optimizer.js — Ollama 로컬 LLM으로 SEO 태그 확장
 *
 * 동작:
 *   1) register_queue.json에서 approved/registered + productId 있는 상품 로드
 *   2) searchTags < 17개인 상품 대상으로 ollama-worker에게 태그 생성 요청
 *   3) 쿠팡 API GET → searchTags 병합 → PUT 업데이트
 *   4) queue의 searchTags 갱신
 *
 * 실행: node scripts/ollama_seo_optimizer.js [--dry-run] [--limit=5]
 *
 * 비용: $0 (로컬 LLM 사용, API 실패 시 자동 스킵)
 */

'use strict';
require('dotenv').config({ path: '/home/dev/openclaw/.env' });

const fs = require('fs');
const path = require('path');
const { cf } = require('./lib/coupang_api');
// ollama_helper는 workspace/scripts/lib에 위치
const { callLLM } = require('/home/dev/openclaw/config/workspace/scripts/lib/ollama_helper');

const QUEUE_PATH = path.join(__dirname, '..', 'data', 'register_queue.json');

function loadQueue() {
  return JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'));
}

function saveQueue(queue) {
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
}

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_ARG = process.argv.find(a => a.startsWith('--limit='));
const MAX_PRODUCTS = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1], 10) : 5;
const MIN_TAGS = 17;   // 이 미만이면 SEO 최적화 대상
const TARGET_TAGS = 20; // 목표 태그 수

const LOG_PATH = path.join(__dirname, '..', 'data', 'ollama_seo_log.json');

// ──────────────────── 쿠팡 API ────────────────────

async function getProduct(sellerProductId) {
  const pathUrl = `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products/${sellerProductId}`;
  const { json } = await cf('GET', pathUrl);
  if (json?.code !== 'SUCCESS') {
    throw new Error(`상품 조회 실패 (${sellerProductId}): ${json?.message || JSON.stringify(json).slice(0, 200)}`);
  }
  return json.data;
}

async function updateProductTags(sellerProductId, fullProduct) {
  const pathUrl = `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products`;
  const { res, json } = await cf('PUT', pathUrl, fullProduct);
  return { status: res.status, code: json?.code, message: json?.message };
}

// ──────────────────── Ollama 태그 생성 ────────────────────

/**
 * ollama-worker로 추가 SEO 태그 생성
 * @returns {string[]} 새 태그 배열 (중복 미포함)
 */
async function generateTagsWithOllama(productName, existingTags, needed) {
  // 3B 모델에 맞게 단순하고 명확한 프롬프트
  const prompt = [
    `Output ONLY a JSON array of ${needed} Korean shopping search keywords for this product.`,
    `Product: "${productName}"`,
    `Exclude: ${existingTags.slice(0, 8).join(', ')}`,
    `Format: ["키워드1","키워드2","키워드3"]`,
    `Rules: Korean only, 2-10 chars, no duplicates, shopping keywords.`,
    `Output:`,
  ].join('\n');

  let result;
  try {
    result = await callLLM(prompt, {
      taskName: 'seo-tags',
      alertOnFallback: false,  // PC 꺼짐 알림 없이 조용히 처리
      fallbackToApi: false,    // API fallback 없음 — PC 꺼지면 스킵
    });
  } catch (err) {
    // PC 꺼짐 또는 ollama 미응답 → 스킵
    throw new Error(`ollama 미응답: ${err.message}`);
  }

  // JSON 파싱 — 응답에서 배열 추출 (여러 패턴 시도)
  const text = result.text || '';

  // 패턴 1: 완전한 JSON 배열
  let parsed = null;
  const arrayMatch = text.match(/\[[\s\S]*?\]/);
  if (arrayMatch) {
    try { parsed = JSON.parse(arrayMatch[0]); } catch { /* next */ }
  }

  // 패턴 2: 따옴표로 감싼 개별 키워드 추출
  if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
    const kwMatches = text.match(/"([^"]{2,20})"/g);
    if (kwMatches && kwMatches.length >= 2) {
      parsed = kwMatches.map(m => m.replace(/"/g, ''));
    }
  }

  if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(`ollama 응답 파싱 실패: ${text.slice(0, 150)}`);
  }

  // 품질 필터 — 한글 포함 여부 필수, 중복/영어전용 제거
  const existingSet = new Set(existingTags.map(t => t.toLowerCase().trim()));
  const seenNew = new Set();
  const filtered = parsed
    .map(t => String(t).trim().slice(0, 20))
    .filter(t => {
      if (t.length < 2 || t.length > 20) return false;
      if (/^\d+$/.test(t)) return false;           // 순수 숫자 제거
      if (/^[A-Za-z\s0-9]+$/.test(t)) return false; // 영어 전용 제거
      if (!/[\uAC00-\uD7A3]/.test(t)) return false;  // 한글 미포함 제거
      if (existingSet.has(t.toLowerCase())) return false; // 기존 태그 중복
      if (seenNew.has(t.toLowerCase())) return false;     // 신규 태그 간 중복
      seenNew.add(t.toLowerCase());
      return true;
    })
    .slice(0, needed);

  console.log(`  [Ollama] ${filtered.length}개 생성 (usedLocal=${result.usedLocal}, ${result.durationMs}ms)`);
  return filtered;
}

// ──────────────────── 메인 ────────────────────

async function main() {
  console.log(`[ollama_seo_optimizer] 시작 ${DRY_RUN ? '(DRY RUN)' : ''} — 최대 ${MAX_PRODUCTS}건`);

  const queue = loadQueue();
  const targets = queue.filter(item =>
    (item.status === 'approved' || item.status === 'registered') &&
    item.productId &&
    Array.isArray(item.searchTags) &&
    item.searchTags.length < MIN_TAGS
  ).slice(0, MAX_PRODUCTS);

  if (targets.length === 0) {
    console.log(`✅ 최적화 대상 없음 (searchTags >= ${MIN_TAGS}개인 상품만 존재)`);
    return;
  }

  console.log(`📋 대상: ${targets.length}건`);

  const log = [];
  let successCount = 0;
  let skipCount = 0;

  for (const item of targets) {
    const { productId, searchTags: existingTags, domeggookProductNo } = item;
    const productName = item.baseInfo?.productName || item.displayName || item.name || '상품명 없음';
    const needed = TARGET_TAGS - existingTags.length;

    console.log(`\n━━━ [${productId}] ${productName.slice(0, 40)} (현재 ${existingTags.length}개)`);

    if (DRY_RUN) {
      console.log(`  ⏭️  DRY RUN — 스킵`);
      log.push({ productId, domeggookProductNo, status: 'dry-run', existingCount: existingTags.length });
      continue;
    }

    // 1. Ollama로 추가 태그 생성
    let newTags;
    try {
      newTags = await generateTagsWithOllama(productName, existingTags, needed);
    } catch (ollamaErr) {
      console.log(`  ⚠️  Ollama 스킵: ${ollamaErr.message}`);
      log.push({ productId, domeggookProductNo, status: 'skipped', reason: ollamaErr.message });
      skipCount++;
      continue;
    }

    if (newTags.length === 0) {
      console.log(`  ⚠️  생성된 태그 없음 — 스킵`);
      log.push({ productId, domeggookProductNo, status: 'skipped', reason: '생성 태그 0개' });
      skipCount++;
      continue;
    }

    const mergedTags = [...existingTags, ...newTags].slice(0, TARGET_TAGS);
    console.log(`  태그: ${existingTags.length}개 → ${mergedTags.length}개 (+${newTags.length}: ${newTags.join(', ')})`);

    // 2. 쿠팡 API로 전체 상품 데이터 GET
    let fullProduct;
    try {
      fullProduct = await getProduct(productId);
    } catch (getErr) {
      console.log(`  ❌ GET 실패: ${getErr.message}`);
      log.push({ productId, domeggookProductNo, status: 'error', stage: 'GET', error: getErr.message });
      continue;
    }

    // 3. searchTags 교체 + PUT
    fullProduct.searchTags = mergedTags;

    try {
      const result = await updateProductTags(productId, fullProduct);
      console.log(`  📤 PUT: ${result.code} (HTTP ${result.status}) ${result.message || ''}`);

      if (result.code === 'SUCCESS') {
        // queue 업데이트
        item.searchTags = mergedTags;
        item.seoOptimizedAt = new Date().toISOString();
        successCount++;
        log.push({ productId, domeggookProductNo, status: 'success', oldCount: existingTags.length, newCount: mergedTags.length, addedTags: newTags });
      } else {
        log.push({ productId, domeggookProductNo, status: 'fail', code: result.code, message: result.message });
      }
    } catch (putErr) {
      console.log(`  ❌ PUT 실패: ${putErr.message}`);
      log.push({ productId, domeggookProductNo, status: 'error', stage: 'PUT', error: putErr.message });
    }

    // API rate limit
    await new Promise(r => setTimeout(r, 800));
  }

  // queue 저장 (변경된 경우만)
  if (successCount > 0) {
    saveQueue(queue);
    console.log(`\n💾 register_queue.json 저장됨`);
  }

  // 로그 저장
  const existingLog = fs.existsSync(LOG_PATH) ? JSON.parse(fs.readFileSync(LOG_PATH, 'utf8')) : [];
  existingLog.push({ runAt: new Date().toISOString(), results: log });
  if (existingLog.length > 100) existingLog.splice(0, existingLog.length - 100);
  fs.writeFileSync(LOG_PATH, JSON.stringify(existingLog, null, 2));

  // 요약
  console.log(`\n═══ 완료 ═══`);
  console.log(`✅ 성공: ${successCount} | ⏭️  스킵: ${skipCount} | 전체: ${targets.length}`);

  // 크론잡 보고용 1줄 출력
  const summary = `🤖 SEO (Ollama) — ${successCount}건 최적화, ${skipCount}건 스킵`;
  console.log(summary);
}

main().catch(e => {
  console.error('[ollama_seo_optimizer] 오류:', e.message);
  process.exit(1);
});

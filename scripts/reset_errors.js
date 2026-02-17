#!/usr/bin/env node
/**
 * 에러 상태 항목 리셋 유틸
 *
 * 사용법:
 *   node reset_errors.js              # 실제 리셋
 *   node reset_errors.js --dry-run    # 변경 없이 대상만 출력
 *
 * 기능:
 *   - error 상태 항목을 pending으로 리셋
 *   - retryCount 추적 (최대 3회까지만 리셋)
 *   - error 필드 초기화
 */
const fs = require('fs');
const path = require('path');

const QUEUE_FILE = path.resolve(__dirname, '../data/register_queue.json');
const MAX_RETRIES = 3;

function loadQueue() {
  if (!fs.existsSync(QUEUE_FILE)) return [];
  return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
}

function saveQueue(queue) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const queue = loadQueue();

  const errors = queue.filter(q => q.status === 'error');
  if (errors.length === 0) {
    console.log('에러 상태 항목 없음.');
    return;
  }

  console.log(`에러 항목 ${errors.length}개 발견${dryRun ? ' (DRY RUN)' : ''}:`);

  let resetCount = 0;
  let skipCount = 0;

  for (const item of errors) {
    const retryCount = (item.retryCount || 0) + 1;

    if (retryCount > MAX_RETRIES) {
      console.log(`  SKIP (${retryCount}회 초과): ${item.sellerName || item.displayName} | ${item.error?.slice(0, 80)}`);
      skipCount++;
      continue;
    }

    console.log(`  RESET → pending (retry ${retryCount}): ${item.sellerName || item.displayName} | ${item.error?.slice(0, 80)}`);

    if (!dryRun) {
      item.status = 'pending';
      item.retryCount = retryCount;
      item.lastError = item.error;
      delete item.error;
      delete item.optimized;
      delete item.seoTimedOut;
    }
    resetCount++;
  }

  if (!dryRun && resetCount > 0) {
    saveQueue(queue);
  }

  console.log(`\n결과: 리셋 ${resetCount}개 | 스킵 ${skipCount}개 (최대 재시도 ${MAX_RETRIES}회 초과)${dryRun ? ' [DRY RUN — 변경 없음]' : ''}`);
}

main();

#!/usr/bin/env node
/**
 * 쿠팡 경쟁 상품 가격 모니터링
 * 윈도우 Browser Relay로 실제 크롬에서 검색 후 최저가 추출
 *
 * Windows PC 꺼져 있으면 큐에 적재 후 조용히 종료 (manual-only 정책, WoL 금지)
 * Windows PC 켜져 있으면 큐 드레인 + 신규 모니터링 실행
 */
const fs = require('fs');
const { spawnSync } = require('child_process');

// .env 로드 (dotenv 의존 없이)
const ENV_PATH = '/home/dev/openclaw/.env';
function loadEnvVars() {
  try {
    const content = fs.readFileSync(ENV_PATH, 'utf-8');
    for (const line of content.split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=["']?(.+?)["']?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}
loadEnvVars();

const { loadWindowsMode, probeWindowsNode, appendWindowsBacklog, withWindowsBacklogLock, readWindowsBacklogUnsafe, writeWindowsBacklogUnsafe } = require('./lib/windows_node');

const QUEUE_PATH = '/home/dev/openclaw/config/workspace/tmp/selpix-saas/data/register_queue.json';
const PRICE_HISTORY_PATH = '/home/dev/openclaw/config/workspace/data/price_history.json';
const LOCK_FILE = '/tmp/browser_relay.lock';
const BROWSER_ALIAS = [
  '--browser-profile', 'openclaw',
  '--url', process.env.BROWSER_RELAY_URL || 'wss://desktop-ir43sud.tail39cdea.ts.net',
  '--token', process.env.BROWSER_RELAY_TOKEN || '',
];

// 가격 히스토리 로드
function loadHistory() {
  try {
    return JSON.parse(fs.readFileSync(PRICE_HISTORY_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveHistory(data) {
  fs.mkdirSync('/home/dev/openclaw/config/workspace/data', { recursive: true });
  fs.writeFileSync(PRICE_HISTORY_PATH, JSON.stringify(data, null, 2));
}

// Browser Relay 명령 실행
function browserCmd(args) {
  const result = spawnSync('openclaw', ['browser', ...args, ...BROWSER_ALIAS], {
    timeout: 20000,
    encoding: 'utf8',
  });
  return result.stdout || '';
}

// 스냅샷에서 가격 추출 (ourPrice 기준으로 범위 필터링)
function extractPrices(snapshot, ourPrice) {
  const prices = [];
  const priceRegex = /(\d{1,3}(?:,\d{3})+)원/g;
  const minPrice = Math.max(1000, ourPrice * 0.2);
  const maxPrice = ourPrice * 5;
  let match;
  while ((match = priceRegex.exec(snapshot)) !== null) {
    const price = parseInt(match[1].replace(/,/g, ''));
    if (price >= minPrice && price <= maxPrice) {
      prices.push(price);
    }
  }
  return [...new Set(prices)].sort((a, b) => a - b);
}

async function main() {
  // Windows 상태 확인
  const mode = loadWindowsMode();
  const health = await probeWindowsNode({ timeoutMs: 2000 });

  if (mode !== 'windows-boosted' || !health.cdpOnline) {
    // Windows 오프라인 — 큐에 적재 후 종료
    const reason = mode !== 'windows-boosted'
      ? 'windows-mode=server-only'
      : 'windows-cdp-offline';

    appendWindowsBacklog({
      kind: 'price_monitor',
      status: 'queued',
      queueReason: reason,
      queuedAt: new Date().toISOString(),
    });

    console.log(`가격 모니터링 큐 적재 (${reason}) — Windows 켜지면 자동 실행`);
    return;
  }

  // Windows 온라인 — 먼저 큐에 쌓인 price_monitor 작업 클리어
  let clearedQueue = 0;
  withWindowsBacklogLock(() => {
    const backlog = readWindowsBacklogUnsafe();
    const remaining = backlog.filter(item => !(item && item.kind === 'price_monitor'));
    clearedQueue = backlog.length - remaining.length;
    if (clearedQueue > 0) {
      writeWindowsBacklogUnsafe(remaining);
    }
  });
  if (clearedQueue > 0) {
    console.log(`큐에서 price_monitor ${clearedQueue}건 클리어 (현재 실행으로 대체)`);
  }

  // Browser Relay 사용 중 표시
  fs.writeFileSync(LOCK_FILE, String(process.pid));
  const cleanup = () => { try { fs.unlinkSync(LOCK_FILE); } catch {} };
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'));
  const targets = queue.filter(p => ['approved', 'registered'].includes(p.status));

  if (targets.length === 0) {
    console.log('모니터링 대상 상품 없음');
    cleanup();
    return;
  }

  console.log(`${targets.length}개 상품 가격 모니터링 시작`);

  const history = loadHistory();
  const alerts = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const product of targets) {
    const { displayName, salePrice, productId } = product;
    if (!displayName || !salePrice) continue;

    const keyword = displayName.replace(/[^가-힣a-zA-Z0-9\s]/g, ' ').trim().slice(0, 20);
    const searchUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent(keyword)}&channel=user`;

    console.log(`\n검색: ${keyword}`);
    console.log(`우리 가격: ${salePrice.toLocaleString()}원`);

    const openResult = browserCmd(['open', searchUrl]);
    if (!openResult.includes('opened')) {
      console.log('브라우저 연결 실패 — 윈도우 PC 꺼져 있을 수 있음');
      break;
    }

    await new Promise(r => setTimeout(r, 3000));

    const snapshot = browserCmd(['snapshot']);
    const prices = extractPrices(snapshot, salePrice);

    if (prices.length === 0) {
      console.log('가격 추출 실패');
      continue;
    }

    const lowestCompetitor = prices[0];
    const prevLowest = history[productId]?.lowestCompetitor;

    history[productId] = {
      name: displayName,
      ourPrice: salePrice,
      lowestCompetitor,
      updatedAt: today,
    };

    console.log(`경쟁 최저가: ${lowestCompetitor.toLocaleString()}원 (상위 3: ${prices.slice(0, 3).map(p => p.toLocaleString()).join(', ')})`);

    const threshold = salePrice * 0.95;
    if (lowestCompetitor < threshold) {
      const diff = ((salePrice - lowestCompetitor) / salePrice * 100).toFixed(1);
      alerts.push({
        name: displayName.slice(0, 30),
        ourPrice: salePrice,
        competitorPrice: lowestCompetitor,
        diff,
        prevLowest,
      });
    }

    if (prevLowest && lowestCompetitor < prevLowest * 0.9) {
      const drop = ((prevLowest - lowestCompetitor) / prevLowest * 100).toFixed(1);
      console.log(`⚠️ 경쟁가 급락 감지: ${drop}% 하락`);
    }
  }

  saveHistory(history);

  if (alerts.length > 0) {
    const lines = alerts.map(a =>
      `• ${a.name}\n  우리: ${a.ourPrice.toLocaleString()}원 → 경쟁: ${a.competitorPrice.toLocaleString()}원 (${a.diff}% 차이)`
    ).join('\n\n');

    console.log(`\n🚨 가격 경쟁 알림 (${today})\n\n${lines}\n\n가격 조정 검토 필요`);
    console.log(`\n알림 발송: ${alerts.length}개 상품`);
  } else {
    console.log('\n✅ 모든 상품 가격 경쟁력 양호');
  }

  console.log('\n가격 모니터링 완료');
}

main().catch(console.error);

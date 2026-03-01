#!/usr/bin/env node
/**
 * 쿠팡 셀러 통계 수집 — Open API 버전
 * Wing 로그인 없이 API 키로 주문/상품/반품 데이터 수집
 */
require('dotenv').config({ path: '/home/dev/openclaw/.env' });
const { cf } = require('./lib/coupang_api');
const { spawnSync } = require('child_process');
const fs = require('fs');

const STATS_PATH = '/home/dev/openclaw/config/workspace/data/seller_stats.json';
const VID = process.env.COUPANG_VENDOR_ID;

function loadStats() {
  try { return JSON.parse(fs.readFileSync(STATS_PATH, 'utf8')); }
  catch { return { history: [] }; }
}

function saveStats(data) {
  fs.mkdirSync('/home/dev/openclaw/config/workspace/data', { recursive: true });
  fs.writeFileSync(STATS_PATH, JSON.stringify(data, null, 2));
}

function dateStr(d) {
  return d.toISOString().slice(0, 10);
}

function kstNow() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

async function fetchOrders(createdAtFrom, createdAtTo, status = 'ACCEPT') {
  const query = `createdAtFrom=${createdAtFrom}T00%3A00%3A00&createdAtTo=${createdAtTo}T23%3A59%3A59&status=${status}&vendorId=${VID}&maxPerPage=100`;
  const path = `/v2/providers/openapi/apis/api/v4/vendors/${VID}/ordersheets`;
  const { json } = await cf('GET', path, null, query);
  return json?.data || [];
}

async function fetchProducts() {
  const query = `vendorId=${VID}&nextToken=1&maxPerPage=100&status=APPROVED`;
  const path = `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products`;
  const { json } = await cf('GET', path, null, query);
  return json?.data || [];
}

async function fetchCancelOrders(from, to) {
  const query = `createdAtFrom=${from}T00%3A00%3A00&createdAtTo=${to}T23%3A59%3A59&vendorId=${VID}&maxPerPage=100`;
  const path = `/v2/providers/openapi/apis/api/v4/vendors/${VID}/ordersheets`;
  const { json } = await cf('GET', path, null, query + '&status=CANCEL');
  return json?.data || [];
}

async function main() {
  const now = kstNow();
  const today = dateStr(now);
  const yesterday = dateStr(new Date(now - 86400000));
  const weekAgo = dateStr(new Date(now - 7 * 86400000));

  console.log(`셀러 통계 수집: ${today} (KST)`);

  const [todayOrders, weekOrders, cancelOrders, products] = await Promise.all([
    fetchOrders(today, today).catch(() => []),
    fetchOrders(weekAgo, today).catch(() => []),
    fetchCancelOrders(today, today).catch(() => []),
    fetchProducts().catch(() => []),
  ]);

  // 매출 집계
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalPayedPrice || 0), 0);
  const weekRevenue = weekOrders.reduce((sum, o) => sum + (o.totalPayedPrice || 0), 0);

  // 상품별 주문 수 집계
  const productSales = {};
  weekOrders.forEach(o => {
    o.orderItems?.forEach(item => {
      const name = item.productName?.slice(0, 20) || '미상';
      productSales[name] = (productSales[name] || 0) + (item.shippingCount || 1);
    });
  });
  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const stats = {
    date: today,
    todayOrders: todayOrders.length,
    todayRevenue,
    weekOrders: weekOrders.length,
    weekRevenue,
    cancelOrders: cancelOrders.length,
    approvedProducts: products.length,
    topProducts,
  };

  console.log(JSON.stringify(stats, null, 2));

  // 히스토리 저장
  const data = loadStats();
  data.history = data.history.filter(h => h.date !== today);
  data.history.push(stats);
  data.history = data.history.slice(-30);
  data.updatedAt = today;
  saveStats(data);

  // Telegram 메시지 구성
  const top = topProducts.length > 0
    ? topProducts.map(([name, cnt]) => `  • ${name}: ${cnt}건`).join('\n')
    : '  데이터 없음';

  const msg = [
    `📊 셀러 일일 리포트 (${today})`,
    ``,
    `🛒 오늘 주문: ${todayOrders.length}건 | 매출: ${todayRevenue.toLocaleString()}원`,
    `📅 주간 주문: ${weekOrders.length}건 | 매출: ${weekRevenue.toLocaleString()}원`,
    `❌ 취소: ${cancelOrders.length}건 | 승인 상품: ${products.length}개`,
    ``,
    `🏆 주간 TOP 상품:`,
    top,
  ].join('\n');

  // Telegram 알림 토픽 29번 (일일 리포트)으로 전송
  spawnSync('curl', [
    '-s',
    '-X', 'POST',
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN || '7986620339:AAGyTw-JMKibRQMGbtqNG9eB02hP-GG0uoM'}/sendMessage`,
    '-d', `chat_id=-1003620634996&message_thread_id=29&text=${encodeURIComponent(msg)}&parse_mode=HTML`,
  ], { encoding: 'utf8' });

  console.log('Telegram 전송 완료');
}

main().catch(err => {
  console.error('에러:', err.message);
  process.exit(1);
});

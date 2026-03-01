#!/usr/bin/env node
/**
 * PC 전원 버튼 봇 (Long Polling)
 * - PC 켜기 (WoL)
 * - PC 끄기 (SSH shutdown, 작업 중 차단)
 * - 상태 확인
 * - 출퇴근 스케줄 자동 실행 (출근 09:30 / 퇴근 23:00 KST)
 */
require('dotenv').config({ path: '/home/dev/openclaw/.env' });
const { spawnSync } = require('child_process');
const https = require('https');
const fs = require('fs');

if (process.env.ALLOW_LEGACY_PC_WOL_BOT !== '1') {
  console.error(
    '[LEGACY_DISABLED] pc_wol_bot.js is deprecated. Use @rodclaw_bot topic 765 inline buttons instead.'
  );
  process.exit(1);
}

const BOT_TOKEN = process.env.TELEGRAM_WOL_BOT_TOKEN; // @Selpix_wol_bot — 버튼 전용
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TOPIC_ID = parseInt(process.env.TELEGRAM_TOPIC_PC_CTRL || '765');

const WOL_HOST = 'selpix.duckdns.org';
const WOL_PORT = '56700';
const WOL_MAC = '70:85:C2:51:8F:17';
const WIN_TAILSCALE_IP = '100.113.239.15';
const LOCK_FILE = '/tmp/browser_relay.lock';

// 출퇴근 스케줄 (KST)
const WORK_START_H = 9;   // 09:30 KST
const WORK_START_M = 30;
const WORK_END_H = 23;    // 23:00 KST
const WORK_END_M = 0;

let offset = 0;
// 종료 확인 대기 상태 (confirm_shutdown 버튼 누른 사람 추적)
const pendingShutdown = new Set();

// ─── Telegram 통신 ──────────────────────────────────────────
function tgCurl(method, body = {}) {
  const result = spawnSync('curl', [
    '-s', '-X', 'POST',
    `https://api.telegram.org/bot${BOT_TOKEN}/${method}`,
    '-H', 'Content-Type: application/json',
    '-d', JSON.stringify(body),
  ], { encoding: 'utf8', timeout: 35000 });
  try { return JSON.parse(result.stdout || '{}'); }
  catch { return { ok: false }; }
}

async function tg(method, body = {}) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/${method}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      timeout: 40000,
    }, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => { try { resolve(JSON.parse(buf)); } catch { resolve({ ok: false }); } });
    });
    req.on('error', (e) => { console.error(`tg ${method}:`, e.message); resolve({ ok: false }); });
    req.on('timeout', () => { req.destroy(); resolve({ ok: false }); });
    req.write(data);
    req.end();
  });
}

// ─── PC 제어 ────────────────────────────────────────────────
function isOnline() {
  return spawnSync('ping', ['-c', '1', '-W', '2', WIN_TAILSCALE_IP], {
    encoding: 'utf8', timeout: 5000,
  }).status === 0;
}

function isBusy() {
  if (!fs.existsSync(LOCK_FILE)) return false;
  // lock 파일의 PID가 실제로 살아있는지 확인
  try {
    const pid = parseInt(fs.readFileSync(LOCK_FILE, 'utf8').trim());
    if (!pid) return false;
    process.kill(pid, 0); // 신호 0 = 프로세스 존재 여부만 확인
    return true;
  } catch {
    // PID가 없으면 stale lock — 삭제
    try { fs.unlinkSync(LOCK_FILE); } catch {}
    return false;
  }
}

function sendWol() {
  return spawnSync('wakeonlan', ['-i', WOL_HOST, '-p', WOL_PORT, WOL_MAC], {
    encoding: 'utf8', timeout: 10000,
  }).status === 0;
}

function shutdownWin() {
  // SSH로 Windows에 60초 후 종료 명령
  return spawnSync('ssh', ['-o', 'StrictHostKeyChecking=no', '-o', 'ConnectTimeout=10',
    'win', 'shutdown /s /t 60 /c "OpenClaw 스케줄 종료"'],
    { encoding: 'utf8', timeout: 15000 },
  ).status === 0;
}

function kstHour() {
  const now = new Date(Date.now() + 9 * 3600 * 1000);
  return { h: now.getUTCHours(), m: now.getUTCMinutes() };
}


// ─── 버튼 핸들러 ─────────────────────────────────────────────
async function handleCallback(query) {
  const { id, data, from } = query;
  const user = from.first_name || from.username || '누군가';
  const uid = from.id;

  console.log(`[${new Date().toISOString()}] 콜백: ${data} from ${user}`);

  // PC 켜기
  if (data === 'wol_pc_on') {
    if (isOnline()) {
      tgCurl('answerCallbackQuery', { callback_query_id: id, text: '✅ PC가 이미 켜져 있습니다!' });
      return;
    }
    const ok = sendWol();
    tgCurl('answerCallbackQuery', {
      callback_query_id: id,
      text: ok ? '📡 WoL 전송! 30~60초 후 켜집니다.' : '❌ WoL 전송 실패',
    });
    if (ok) {
      tgCurl('sendMessage', {
        chat_id: CHAT_ID,
        message_thread_id: TOPIC_ID,
        text: `🟢 <b>${user}</b>님이 PC를 켰습니다.\n📡 30~60초 후 온라인됩니다.`,
        parse_mode: 'HTML',
      });
    }
    return;
  }

  // 상태 확인
  if (data === 'wol_pc_status') {
    const online = isOnline();
    const busy = online && isBusy();
    const { h, m } = kstHour();
    const inWorkHour = (h > WORK_START_H || (h === WORK_START_H && m >= WORK_START_M))
      && (h < WORK_END_H || (h === WORK_END_H && m < WORK_END_M));

    // Ollama 상태 체크 (PC 온라인일 때만)
    let ollamaStatus = '';
    if (online) {
      const ollamaCheck = spawnSync('ssh', [
        '-o', 'ConnectTimeout=3', '-o', 'StrictHostKeyChecking=no', 'win',
        'cmd /c "netstat -an 2>&1"',
      ], { encoding: 'utf8', timeout: 8000 });
      const ollamaUp = ollamaCheck.stdout && ollamaCheck.stdout.includes('11434');
      ollamaStatus = ollamaUp ? '\n🤖 Ollama: 실행 중' : '\n🤖 Ollama: 꺼짐';
    }

    tgCurl('answerCallbackQuery', {
      callback_query_id: id,
      text: online
        ? `✅ PC 온라인${busy ? ' (작업 중)' : ''}\n⏰ ${inWorkHour ? '근무시간' : '비근무시간'}${ollamaStatus}`
        : '⚫ PC 오프라인',
      show_alert: true,
    });
    return;
  }

  // PC 끄기 — 1단계: 안전 체크
  if (data === 'wol_pc_off') {
    if (!isOnline()) {
      tgCurl('answerCallbackQuery', { callback_query_id: id, text: '⚫ PC가 이미 꺼져 있습니다.' });
      return;
    }
    if (isBusy()) {
      tgCurl('answerCallbackQuery', {
        callback_query_id: id,
        text: '⚠️ Browser Relay 작업 중!\n가격 모니터링이 실행 중입니다.\n완료 후 다시 시도하세요.',
        show_alert: true,
      });
      return;
    }
    // 확인 메시지
    pendingShutdown.add(uid);
    tgCurl('answerCallbackQuery', { callback_query_id: id, text: '⬇️ 아래 확인 버튼을 눌러주세요' });
    tgCurl('sendMessage', {
      chat_id: CHAT_ID,
      message_thread_id: TOPIC_ID,
      text: `🔴 <b>${user}</b>님이 PC 종료를 요청했습니다.\n\n정말 끄시겠어요? 60초 후 종료됩니다.`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ 네, 종료합니다', callback_data: 'wol_pc_off_confirm' },
          { text: '❌ 취소', callback_data: 'wol_pc_off_cancel' },
        ]],
      },
    });
    return;
  }

  // PC 끄기 — 2단계: 확인
  if (data === 'wol_pc_off_confirm') {
    if (!pendingShutdown.has(uid)) {
      tgCurl('answerCallbackQuery', { callback_query_id: id, text: '⚠️ 먼저 🔴 PC 끄기 버튼을 누르세요.' });
      return;
    }
    pendingShutdown.delete(uid);

    // 다시 한 번 busy 체크
    if (isBusy()) {
      tgCurl('answerCallbackQuery', {
        callback_query_id: id,
        text: '⚠️ 방금 작업이 시작됐습니다. 종료 취소.',
        show_alert: true,
      });
      return;
    }
    const ok = shutdownWin();
    tgCurl('answerCallbackQuery', {
      callback_query_id: id,
      text: ok ? '🔴 종료 명령 전송 완료' : '❌ SSH 종료 실패',
    });
    if (ok) {
      tgCurl('sendMessage', {
        chat_id: CHAT_ID,
        message_thread_id: TOPIC_ID,
        text: `🔴 <b>${user}</b>님이 PC를 종료했습니다.\n⏱️ 60초 후 꺼집니다.`,
        parse_mode: 'HTML',
      });
    }
    return;
  }

  // 취소
  if (data === 'wol_pc_off_cancel') {
    pendingShutdown.delete(uid);
    tgCurl('answerCallbackQuery', { callback_query_id: id, text: '✅ 종료 취소됨' });
    return;
  }
}

// ─── 메인 루프 ───────────────────────────────────────────────
async function poll() {
  while (true) {
    try {
      const res = await tg('getUpdates', {
        offset,
        timeout: 30,
        allowed_updates: ['callback_query'],
      });
      if (res.ok && res.result?.length > 0) {
        for (const update of res.result) {
          offset = update.update_id + 1;
          if (update.callback_query) await handleCallback(update.callback_query);
        }
      }
    } catch (e) {
      console.error('polling 에러:', e.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

console.log(`[${new Date().toISOString()}] PC WoL 봇 시작 (@Selpix_wol_bot — 버튼 전용)`);
console.log(`  스케줄(출퇴근): openclaw-gateway cron 위임`);
poll();

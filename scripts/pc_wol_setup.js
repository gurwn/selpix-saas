#!/usr/bin/env node
/**
 * PC 전원 버튼 셋업
 * 1. Telegram 새 토픽 생성 (PC 컨트롤)
 * 2. 인라인 버튼 메시지 전송 + 핀
 */
require('dotenv').config({ path: '/home/dev/openclaw/.env' });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(`${method} 실패: ${JSON.stringify(json)}`);
  return json.result;
}

async function main() {
  console.log('1. 토픽 생성 중...');
  const topic = await tg('createForumTopic', {
    chat_id: CHAT_ID,
    name: '🖥️ PC 컨트롤',
    icon_emoji_id: '5373230226810585908', // 컴퓨터 이모지
  }).catch(async () => {
    // 이미 존재하거나 실패 시 ICON 없이 재시도
    return tg('createForumTopic', {
      chat_id: CHAT_ID,
      name: '🖥️ PC 컨트롤',
    });
  });

  const threadId = topic.message_thread_id;
  console.log(`토픽 생성됨: thread_id=${threadId}`);

  // .env에 저장용 출력
  console.log(`\nTELEGRAM_TOPIC_PC_CTRL=${threadId}\n`);

  console.log('2. WoL 버튼 메시지 전송...');
  const msg = await tg('sendMessage', {
    chat_id: CHAT_ID,
    message_thread_id: threadId,
    text: [
      '🖥️ <b>Windows PC 전원 제어</b>',
      '',
      '버튼을 눌러 PC를 켜세요.',
      '켜지는 데 30~60초 소요됩니다.',
      '',
      '📍 MAC: 70:85:C2:51:8F:17',
      '🌐 WoL: selpix.duckdns.org:56700',
    ].join('\n'),
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🟢 PC 켜기', callback_data: 'wol_pc_on' },
          { text: '🔴 PC 끄기', callback_data: 'wol_pc_off' },
        ],
        [
          { text: '📡 상태 확인', callback_data: 'wol_pc_status' },
        ],
      ],
    },
  });

  console.log(`메시지 전송됨: msg_id=${msg.message_id}`);

  console.log('3. 메시지 핀 중...');
  await tg('pinChatMessage', {
    chat_id: CHAT_ID,
    message_id: msg.message_id,
    disable_notification: true,
  });

  console.log('\n✅ 완료!');
  console.log(`토픽 thread_id: ${threadId}`);
  console.log('.env에 추가: TELEGRAM_TOPIC_PC_CTRL=' + threadId);
}

main().catch(err => {
  console.error('에러:', err.message);
  process.exit(1);
});

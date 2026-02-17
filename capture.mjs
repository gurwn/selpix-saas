import puppeteer from 'puppeteer'
import path from 'path'
import fs from 'fs'

const BASE = 'http://localhost:3099'
const OUT = path.resolve('screenshots')
fs.mkdirSync(OUT, { recursive: true })

const VIEWPORT = { width: 1440, height: 900 }
const delay = (ms) => new Promise((r) => setTimeout(r, ms))

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })

  const page = await browser.newPage()
  await page.setViewport(VIEWPORT)

  const snap = async (name, url, opts = {}) => {
    const { waitMs = 2000, fullPage = true, action } = opts
    console.log(`📸 ${name} → ${url}`)
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })
    await delay(waitMs)
    if (action) await action(page)
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage })
  }

  // 1. 대시보드
  await snap('01_dashboard', `${BASE}/`)

  // 2. 도매 검색
  await snap('02_wholesale_search', `${BASE}/wholesale-search`)

  // 3. AI 추천
  await snap('03_ai_recommendation', `${BASE}/recommendation`)

  // 4. 마진 계산기
  await snap('04_margin_calculator', `${BASE}/margin`)

  // 5. 상세페이지
  await snap('05_detail_page', `${BASE}/detail-page`)

  // 6. 경쟁사 벤치마킹 - 빈 입력 상태
  await snap('06_benchmark_input', `${BASE}/benchmark`)

  // 7. 경쟁사 벤치마킹 - 입력 + 분석
  await snap('07_benchmark_analyze', `${BASE}/benchmark`, {
    waitMs: 800,
    action: async (p) => {
      // 상품명 입력
      const inputs = await p.$$('input[type="text"]')
      if (inputs[0]) {
        await inputs[0].click({ clickCount: 3 })
        await inputs[0].type('프리미엄 무선 이어폰 BT-500')
      }
      if (inputs[1]) {
        await inputs[1].click({ clickCount: 3 })
        await inputs[1].type('블루투스 5.3, 노이즈캔슬링, 19900원')
      }
      // 경쟁사 URL 입력
      const urlInputs = await p.$$('input[type="url"]')
      if (urlInputs[0]) {
        await urlInputs[0].click({ clickCount: 3 })
        await urlInputs[0].type('https://smartstore.naver.com/example/products/12345')
      }
      await delay(300)
      await p.screenshot({ path: path.join(OUT, '07_benchmark_filled.png'), fullPage: true })

      // 분석 버튼 클릭
      const buttons = await p.$$('button')
      for (const btn of buttons) {
        const text = await p.evaluate((el) => el.textContent, btn)
        if (text && text.includes('분석하기')) {
          await btn.click()
          break
        }
      }
      // 분석 완료 대기
      await delay(4000)
    },
  })
  // 분석 결과
  await page.screenshot({ path: path.join(OUT, '08_benchmark_result.png'), fullPage: true })

  // 8. A/B 테스트 목록
  await snap('09_ab_test_list', `${BASE}/ab-test`)

  // 9. A/B 테스트 상세
  await snap('10_ab_test_detail', `${BASE}/ab-test`, {
    waitMs: 800,
    action: async (p) => {
      const rows = await p.$$('div[style*="cursor: pointer"]')
      if (rows[0]) {
        await rows[0].click()
        await delay(800)
      }
    },
  })

  // 10. 쿠팡 등록
  await snap('11_registration', `${BASE}/registration`)

  // 11. 구독 관리
  await snap('12_subscription', `${BASE}/subscription`)

  // 12. 구독 - PRO 플랜 선택
  await snap('13_subscription_pro', `${BASE}/subscription`, {
    waitMs: 800,
    action: async (p) => {
      const planCards = await p.$$('div[style*="cursor: pointer"]')
      if (planCards[2]) {
        await planCards[2].click()
        await delay(500)
      }
    },
  })

  // 13. 작업 이력
  await snap('14_logs', `${BASE}/logs`)

  await browser.close()
  console.log(`\n✅ 스크린샷 ${fs.readdirSync(OUT).length}장 저장 → ${OUT}`)
}

run().catch(console.error)

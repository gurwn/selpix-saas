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

  // 1. 벤치마킹 - 입력 + 분석 + 결과
  console.log('📸 benchmark flow...')
  await page.goto(`${BASE}/benchmark`, { waitUntil: 'networkidle0', timeout: 30000 })
  await delay(1000)

  // 상품명 입력
  const inputs = await page.$$('input[type="text"]')
  if (inputs[0]) {
    await inputs[0].click({ clickCount: 3 })
    await inputs[0].type('프리미엄 무선 이어폰 BT-500')
  }
  if (inputs[1]) {
    await inputs[1].click({ clickCount: 3 })
    await inputs[1].type('블루투스 5.3, 노이즈캔슬링, 19900원')
  }
  const urlInputs = await page.$$('input[type="url"]')
  if (urlInputs[0]) {
    await urlInputs[0].click({ clickCount: 3 })
    await urlInputs[0].type('https://smartstore.naver.com/example/products/12345')
  }
  await delay(500)

  // 분석 버튼 클릭
  const buttons = await page.$$('button')
  for (const btn of buttons) {
    const text = await page.evaluate((el) => el.textContent, btn)
    if (text && text.includes('분석하기')) {
      await btn.click()
      break
    }
  }

  // 충분한 대기 (API 실패 + 1초 mock 딜레이 + 렌더링)
  console.log('  waiting for analysis result...')
  await delay(8000)

  await page.screenshot({ path: path.join(OUT, '08_benchmark_result.png'), fullPage: true })
  console.log('  ✅ 08_benchmark_result.png')

  // 2. A/B 테스트 상세
  console.log('📸 ab-test detail...')
  await page.goto(`${BASE}/ab-test`, { waitUntil: 'networkidle0', timeout: 30000 })
  await delay(1500)

  // 첫번째 테스트 카드를 XPath로 찾기 — "무선 이어폰" 텍스트가 있는 카드
  const testCard = await page.evaluateHandle(() => {
    const allH3 = document.querySelectorAll('h3')
    for (const h3 of allH3) {
      if (h3.textContent.includes('무선 이어폰')) {
        // h3의 부모 중 cursor: pointer인 것을 찾기
        let el = h3
        while (el.parentElement) {
          el = el.parentElement
          if (el.style && el.style.cursor === 'pointer') return el
        }
        // 없으면 상위 카드를 반환
        return h3.closest('[class]') || h3.parentElement
      }
    }
    return null
  })

  if (testCard) {
    await testCard.click()
    await delay(1000)
  }

  await page.screenshot({ path: path.join(OUT, '10_ab_test_detail.png'), fullPage: true })
  console.log('  ✅ 10_ab_test_detail.png')

  // 3. 구독 PRO 선택
  console.log('📸 subscription pro...')
  await page.goto(`${BASE}/subscription`, { waitUntil: 'networkidle0', timeout: 30000 })
  await delay(1500)

  // PRO 카드 클릭
  const proCard = await page.evaluateHandle(() => {
    const allH3 = document.querySelectorAll('h3')
    for (const h3 of allH3) {
      if (h3.textContent.includes('PRO')) {
        let el = h3
        while (el.parentElement) {
          el = el.parentElement
          if (el.style && el.style.cursor === 'pointer') return el
        }
        return h3.parentElement?.parentElement
      }
    }
    return null
  })

  if (proCard) {
    await proCard.click()
    await delay(800)
  }

  await page.screenshot({ path: path.join(OUT, '13_subscription_pro.png'), fullPage: true })
  console.log('  ✅ 13_subscription_pro.png')

  await browser.close()
  console.log('\n✅ 재캡처 완료')
}

run().catch(console.error)

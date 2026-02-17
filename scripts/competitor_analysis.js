#!/usr/bin/env node
/**
 * competitor_analysis.js — 다나와 curl 기반 경쟁사 가격 분석
 *
 * 실행: node scripts/competitor_analysis.js [--limit=N]
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUR_PATH = path.join(__dirname, '..', 'data', 'our_products_detail.json');
const REPORT_PATH = path.join(__dirname, '..', 'data', 'competitor_report.json');
const MD_REPORT_PATH = path.join(__dirname, '..', 'data', 'competitor_report.md');

const LIMIT = parseInt(process.argv.find(a => a.startsWith('--limit='))?.split('=')[1] || '999');

/**
 * 상품명에서 다나와 검색 키워드 추출 (2-3단어, 제품 유형 중심)
 */
function extractSearchQuery(displayName) {
  let q = displayName
    .replace(/\[.*?\]/g, '')
    .replace(/\//g, ' ')
    .replace(/\d+P\b/gi, '')
    .replace(/1개|개별|박스포장|봉투\s*제공|은색\s*금색/g, '')
    .replace(/아이폰\s*\d+|갤럭시\s*S\d+/g, '')
    .replace(/S20|노트|프로|17|16|15|14|13|S26|25|24|23/g, '')
    .trim();
  const stopwords = new Set(['용', '형', '소품', '도구', '포함', '호환', '데일리', '소식', '알리기', '겸용', '제공']);
  const words = q.split(/\s+/).filter(w => w.length >= 2 && !stopwords.has(w));
  return words.slice(0, 3).join(' ');
}

/**
 * 다나와 검색 (curl 기반, 빠르고 안정적)
 */
function searchDanawa(query) {
  const url = `https://search.danawa.com/dsearch.php?query=${encodeURIComponent(query)}&tab=goods`;
  try {
    const html = execSync(
      `curl -sL "${url}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"`,
      { timeout: 15000, encoding: 'utf-8', maxBuffer: 2 * 1024 * 1024 }
    );

    // 실판매가 추출: 쇼핑몰 가격 (통합검색_상품블로그_유입 뒤) + 와우할인가
    const allPrices = [];
    let m;

    // 패턴 1: 쇼핑몰 실판매가 (통합검색_상품블로그_유입 뒤 가격)
    const shopPattern = /통합검색_상품블로그_유입[^>]*>[^<]*?(\d{1,3}(?:,\d{3})+)원/g;
    while ((m = shopPattern.exec(html)) !== null) {
      allPrices.push(parseInt(m[1].replace(/,/g, '')));
    }

    // 패턴 2: 와우할인가 (쿠팡)
    const wowPattern = /와우할인가<\/em><\/span>(\d{1,3}(?:,\d{3})+)원/g;
    while ((m = wowPattern.exec(html)) !== null) {
      allPrices.push(parseInt(m[1].replace(/,/g, '')));
    }

    // 패턴 3: 일반 최저가 표시 (low-price 클래스 근처)
    const lowPattern = /low-price[^>]*>(?:<[^>]+>)*\s*(\d{1,3}(?:,\d{3})+)원/g;
    while ((m = lowPattern.exec(html)) !== null) {
      allPrices.push(parseInt(m[1].replace(/,/g, '')));
    }

    // 가격 범위 필터 + 중복 제거
    const prices = [...new Set(allPrices.filter(p => p >= 1000 && p <= 3000000))].slice(0, 30);

    // 상품명 추출
    const namePattern = /prod\.danawa\.com[^"]*"[^>]*title="([^"]{5,80})"/g;
    const products = [];
    while ((m = namePattern.exec(html)) !== null) {
      products.push(m[1].replace(/&amp;/g, '&').trim());
    }

    return { prices, products, resultCount: prices.length };
  } catch (e) {
    return { prices: [], products: [], resultCount: 0, error: e.message?.slice(0, 80) };
  }
}

function priceStats(prices) {
  if (!prices.length) return null;
  const sorted = [...prices].sort((a, b) => a - b);
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: sorted[Math.floor(sorted.length / 2)],
    avg: Math.round(sorted.reduce((s, p) => s + p, 0) / sorted.length),
    count: sorted.length,
    p25: sorted[Math.floor(sorted.length * 0.25)],
    p75: sorted[Math.floor(sorted.length * 0.75)],
  };
}

function assessCompetitiveness(ourPrice, stats) {
  if (!stats || stats.count < 2) return { grade: '❓', comment: '비교 데이터 부족' };
  const ratio = ourPrice / stats.median;
  if (ratio > 3) return { grade: '🔴', comment: `시장가의 ${ratio.toFixed(1)}배 — 판매 불가 수준`, ratio };
  if (ratio > 2) return { grade: '🟠', comment: `시장가의 ${ratio.toFixed(1)}배 — 가격 경쟁력 매우 낮음`, ratio };
  if (ratio > 1.5) return { grade: '🟡', comment: `시장가의 ${ratio.toFixed(1)}배 — 가격 높은 편`, ratio };
  if (ratio > 1.1) return { grade: '🟢', comment: `시장가 대비 ${((ratio - 1) * 100).toFixed(0)}% 높음 — 적정`, ratio };
  if (ratio > 0.9) return { grade: '✅', comment: '시장 평균 수준 — 경쟁력 있음', ratio };
  return { grade: '💰', comment: `시장가 대비 ${((1 - ratio) * 100).toFixed(0)}% 저렴`, ratio };
}

async function main() {
  const ourProducts = JSON.parse(fs.readFileSync(OUR_PATH, 'utf-8'))
    .filter(p => !p.error)
    .slice(0, LIMIT);

  console.log(`\n📊 경쟁사 가격 분석 시작 (${ourProducts.length}개 상품)\n`);
  const results = [];

  for (let i = 0; i < ourProducts.length; i++) {
    const prod = ourProducts[i];
    const query = extractSearchQuery(prod.displayName);
    process.stdout.write(`[${i + 1}/${ourProducts.length}] ${prod.displayName.slice(0, 40)}... `);

    const danawa = searchDanawa(query);
    const stats = priceStats(danawa.prices);
    const assessment = assessCompetitiveness(prod.minPrice, stats);

    results.push({
      pid: prod.pid,
      displayName: prod.displayName,
      ourPrice: prod.minPrice,
      searchQuery: query,
      market: stats,
      assessment,
      sampleProducts: danawa.products.slice(0, 5),
    });

    if (stats && stats.count >= 2) {
      console.log(`${assessment.grade} ₩${prod.minPrice.toLocaleString()} vs 중간 ₩${stats.median.toLocaleString()} (${stats.count}개)`);
    } else {
      console.log(`❓ 비교데이터 부족 (${danawa.prices.length}건)`);
    }

    // Rate limit — 1초 간격
    await new Promise(r => setTimeout(r, 1000));
  }

  // JSON 저장
  fs.writeFileSync(REPORT_PATH, JSON.stringify(results, null, 2));

  // 마크다운 보고서
  let md = `# 🏆 쿠팡 경쟁사 가격 분석 보고서\n\n`;
  md += `**분석일시:** ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}\n`;
  md += `**분석 대상:** ${results.length}개 상품\n`;
  md += `**데이터 소스:** 다나와 (danawa.com)\n\n`;

  // 등급별 집계
  const grades = {};
  results.forEach(r => { grades[r.assessment.grade] = (grades[r.assessment.grade] || 0) + 1; });

  md += `## 📊 종합 요약\n\n`;
  md += `| 등급 | 의미 | 수량 |\n|:---:|------|:---:|\n`;
  md += `| 🔴 | 판매 불가 수준 (시장가 3배+) | ${grades['🔴'] || 0} |\n`;
  md += `| 🟠 | 매우 높음 (2~3배) | ${grades['🟠'] || 0} |\n`;
  md += `| 🟡 | 높은 편 (1.5~2배) | ${grades['🟡'] || 0} |\n`;
  md += `| 🟢 | 적정 수준 (1.1~1.5배) | ${grades['🟢'] || 0} |\n`;
  md += `| ✅ | 경쟁적 (0.9~1.1배) | ${grades['✅'] || 0} |\n`;
  md += `| 💰 | 매우 저렴 (<0.9배) | ${grades['💰'] || 0} |\n`;
  md += `| ❓ | 데이터 부족 | ${grades['❓'] || 0} |\n\n`;

  // 위험 상품 우선
  const risky = results.filter(r => ['🔴', '🟠', '🟡'].includes(r.assessment.grade));
  if (risky.length) {
    md += `## ⚠️ 가격 조정 권장 상품 (${risky.length}개)\n\n`;
    md += `| 상품명 | 우리 가격 | 시장 중간가 | 배율 | 등급 |\n|------|------:|------:|:---:|:---:|\n`;
    for (const r of risky.sort((a, b) => (b.assessment.ratio || 0) - (a.assessment.ratio || 0))) {
      md += `| ${r.displayName.slice(0, 30)} | ₩${r.ourPrice.toLocaleString()} | ₩${r.market?.median?.toLocaleString() || 'N/A'} | ${r.assessment.ratio?.toFixed(1) || '?'}x | ${r.assessment.grade} |\n`;
    }
    md += `\n`;
  }

  // 경쟁력 있는 상품
  const good = results.filter(r => ['✅', '💰', '🟢'].includes(r.assessment.grade));
  if (good.length) {
    md += `## ✅ 경쟁력 있는 상품 (${good.length}개)\n\n`;
    md += `| 상품명 | 우리 가격 | 시장 중간가 | 비고 |\n|------|------:|------:|------|\n`;
    for (const r of good) {
      md += `| ${r.displayName.slice(0, 30)} | ₩${r.ourPrice.toLocaleString()} | ₩${r.market?.median?.toLocaleString() || 'N/A'} | ${r.assessment.comment.slice(0, 20)} |\n`;
    }
    md += `\n`;
  }

  // 전체 상세
  md += `## 📋 전체 상품 상세\n\n`;
  for (const r of results) {
    md += `### ${r.assessment.grade} ${r.displayName}\n`;
    md += `- 우리 가격: **₩${r.ourPrice.toLocaleString()}**\n`;
    if (r.market && r.market.count >= 2) {
      md += `- 시장 최저: ₩${r.market.min.toLocaleString()} / 중간: ₩${r.market.median.toLocaleString()} / 최고: ₩${r.market.max.toLocaleString()}\n`;
      md += `- 비교 상품 수: ${r.market.count}개\n`;
    }
    md += `- 평가: ${r.assessment.comment}\n`;
    md += `- 검색어: \`${r.searchQuery}\`\n\n`;
  }

  fs.writeFileSync(MD_REPORT_PATH, md);

  // 최종 요약 출력
  console.log(`\n═══ 분석 완료 ═══`);
  console.log(`🔴 판매불가: ${grades['🔴'] || 0} | 🟠 매우높음: ${grades['🟠'] || 0} | 🟡 높음: ${grades['🟡'] || 0}`);
  console.log(`🟢 적정: ${grades['🟢'] || 0} | ✅ 경쟁적: ${grades['✅'] || 0} | 💰 저렴: ${grades['💰'] || 0} | ❓ 부족: ${grades['❓'] || 0}`);
  console.log(`📊 JSON: ${REPORT_PATH}`);
  console.log(`📝 보고서: ${MD_REPORT_PATH}`);
}

main().catch(e => { console.error(e); process.exit(1); });

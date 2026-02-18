
import OpenAI from 'openai'
import type { BenchmarkResult } from '@/types/benchmark'

// 클라이언트가 사용할 때만 환경변수 체크 (빌드 타임 에러 방지)
const apiKey = process.env.OPENAI_API_KEY

const openai = apiKey ? new OpenAI({ apiKey }) : null

export interface ProductRecommendation {
    bestName: string
    alternatives: string[]
    keywords: string[]
}

export async function generateProductMetadata(productContext: string): Promise<ProductRecommendation | null> {
    if (!openai) {
        console.error('OPENAI_API_KEY is missing')
        return null
    }

    const systemPrompt = `
당신은 쿠팡 상품등록 최적화 전문가입니다.
입력된 도매 상품 정보를 바탕으로 다음 규칙에 따라 쿠팡형 상품명을 생성합니다.

[규칙]
1. 상품명 구조: 메인키워드 + 차별키워드(효과/사용성) + 옵션 핵심스펙 순서.
2. 검색량이 낮거나 과도하게 장식적인 단어는 제거 (예: 프리미엄, 고급형 등 남발 금지).
3. 쿠팡정책에 위배되는 표현 금지: 최저가, 1위, 리뷰폭발, 무료배송 등.
4. 사용자의 구매 의도와 문제 해결 요소를 상품명에 반영.
5. 40~60자 사이에서 최적화된 검색성/가독성을 확보.

[출력 형식 (JSON)]
{
  "bestName": "최적 상품명 1개",
  "alternatives": ["대체 상품명 1", "대체 상품명 2", "대체 상품명 3"],
  "keywords": ["키워드1", "키워드2", ...] (20개)
}
`

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: productContext }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7
        })

        const content = completion.choices[0].message.content
        if (!content) return null

        const parsed = JSON.parse(content)
        return {
            bestName: parsed.bestName || '',
            alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : [],
            keywords: Array.isArray(parsed.keywords) ? parsed.keywords : []
        }
    } catch (err) {
        console.error('OpenAI generation failed:', err)
        return null
    }
}

export interface PriceRecommendationInput {
    totalCost: number;
    feeRate: number;
    shippingCost: number;
    adOnOff: boolean;
    marketPrices: number[];
    candidatePrices: number[];
}

export interface PriceRecommendationResult {
    recommendedPrice: number;
    alternatives: number[];
    margins: { price: number; marginRate: number }[];
    reasoning?: string;
}

export async function generatePriceRecommendation(input: PriceRecommendationInput): Promise<PriceRecommendationResult | null> {
    if (!openai) {
        console.error('OpenAI API Key missing');
        return null;
    }

    const systemPrompt = `
당신은 쿠팡 판매가 최적화 전문가입니다.
아래 입력값을 기반으로 실제 경쟁시장에 맞는 최적 판매가 범위를 제안하세요.

[규칙]
1. 후보군 중 실제 판매가능성이 높은 가격 3개만 선택.
2. 너무 낮아서 손해나는 가격은 제외.
3. 너무 높아서 노출이 떨어지는 가격도 제외.
4. 마진률(%)을 함께 계산하여 출력.
5. 사용자가 바로 상품 등록에 넣을 수 있도록 ‘추천정가 / 최소가 / 최대가’ 구조로 제시.

[출력 형식 (JSON)]
{
  "recommendedPrice": 15000,
  "alternatives": [14500, 16000],
  "margins": [
    { "price": 15000, "marginRate": 25.5 },
    { "price": 14500, "marginRate": 22.0 },
    { "price": 16000, "marginRate": 30.1 }
  ],
  "reasoning": "간략한 추천 사유"
}
`;

    const userContent = `
[입력]
[입력]
- 상품원가(totalCost): ${input.totalCost}원
- 쿠팡 수수료율: ${input.feeRate}%
- 배송비: ${input.shippingCost}원
- 광고비 적용여부: ${input.adOnOff ? 'ON' : 'OFF'}
- 경쟁상품 상위 10개 가격: ${JSON.stringify(input.marketPrices)}
- 예상판매가 후보군(배수 기반): ${JSON.stringify(input.candidatePrices)}

* 주의: 마진 계산 시 (판매가 - (상품원가 + 배송비 + 수수료))로 계산하세요.
`;

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userContent }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.5,
        });

        const content = completion.choices[0].message.content;
        if (!content) return null;

        return JSON.parse(content) as PriceRecommendationResult;
    } catch (error) {
        console.error('AI Price Gen Error:', error);
        return null;
    }
}

// ── SEO Optimize for Coupang ─────────────────────────────────

export interface SEOOptimizationResult {
    optimizedName: string;       // ≤100자 SEO 상품명
    suggestedPrice: number;      // 10원 단위, 심리가격 전략
    priceReasoning: string;      // 가격 산출 근거 (한 줄)
    searchTags: string[];        // 정확히 10개
    confidence: number;          // 0-100
}

export async function optimizeForCoupang(input: {
    originalName: string;
    wholesalePrice: number;
    category?: string;
    sourcingKeyword?: string;
    currentSalePrice?: number;
    currentTags?: string[];
}): Promise<SEOOptimizationResult> {
    const fallbackPrice = input.currentSalePrice || Math.round((input.wholesalePrice * 2.2) / 10) * 10
    const fallback: SEOOptimizationResult = {
        optimizedName: input.originalName.slice(0, 100),
        suggestedPrice: fallbackPrice,
        priceReasoning: '규칙 기반 기본 마진율 적용',
        searchTags: input.currentTags?.slice(0, 10) || [],
        confidence: 0,
    }

    if (!openai) {
        console.error('OPENAI_API_KEY is missing')
        return fallback
    }

    const systemPrompt = `당신은 쿠팡 SEO 최적화 전문가입니다. 도매 상품 정보를 받아 쿠팡 검색 최적화된 상품명, 판매가, 검색 태그를 동시에 제안합니다.

[상품명 규칙]
- 100자 이내, 특수문자(!@#$%^&*) 금지
- 구조: [타입] [핵심특징] [용도] [규격]
- 도매꾹 불필요 정보 제거: "도매가", "대량", "최저가", "공장직송", "무료배송" 등
- 검색량이 높은 메인 키워드를 앞쪽에 배치
- 브랜드가 불확실하면 절대 가짜 브랜드를 창조하지 마세요

[가격 규칙]
- 도매가 기준, 쿠팡 수수료 10.8% 감안
- 순마진 25-40% 목표
- 심리가격 전략: xx90원 또는 xx900원으로 설정
- 10원 단위 반올림

[태그 규칙]
- 정확히 10개 생성
- 소싱 키워드가 있으면 반드시 첫 번째로 포함
- 동의어, 장문 키워드(2-4단어 조합), 용도별 키워드 포함
- 브랜드명/경쟁사명은 절대 포함 금지

[출력 형식 (JSON)]
{
  "optimizedName": "최적화된 상품명",
  "suggestedPrice": 12900,
  "priceReasoning": "가격 산출 근거 한 줄",
  "searchTags": ["태그1", "태그2", ..., "태그10"],
  "confidence": 85
}`

    const userContent = `[상품 정보]
- 원래 상품명: ${input.originalName}
- 도매가: ${input.wholesalePrice}원
- 카테고리: ${input.category || '미지정'}
- 소싱 키워드: ${input.sourcingKeyword || '없음'}
- 현재 판매가: ${input.currentSalePrice || '미설정'}
- 기존 태그: ${input.currentTags?.join(', ') || '없음'}`

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userContent }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.4,
        })

        const content = completion.choices[0].message.content
        if (!content) return fallback

        const parsed = JSON.parse(content)

        // ── 후처리 가드레일 ──
        let name = String(parsed.optimizedName || input.originalName)
        if (name.length > 100) name = name.slice(0, 100)

        let price = Number(parsed.suggestedPrice) || fallbackPrice
        if (price < 1000 || price > 500000) price = fallbackPrice
        price = Math.round(price / 10) * 10

        let tags: string[] = Array.isArray(parsed.searchTags) ? parsed.searchTags : []
        tags = tags.filter((t: string) => typeof t === 'string' && t.trim().length > 0)
        if (tags.length > 10) tags = tags.slice(0, 10)

        const confidence = Math.min(100, Math.max(0, Number(parsed.confidence) || 50))

        return {
            optimizedName: name,
            suggestedPrice: price,
            priceReasoning: String(parsed.priceReasoning || ''),
            searchTags: tags,
            confidence,
        }
    } catch (err) {
        console.error('optimizeForCoupang failed:', err)
        return fallback
    }
}

export async function benchmarkCompetitors(
    myProductName: string,
    myProductInfo: string,
    competitorUrls: string[]
): Promise<BenchmarkResult | null> {
    if (!openai) {
        console.error('OPENAI_API_KEY is missing');
        return null;
    }

    const systemPrompt = `
당신은 이커머스 경쟁사 분석 전문가입니다.
사용자의 상품 정보와 경쟁사 URL 목록을 받아 소구점을 분석합니다.

[분석 항목]
1. 각 경쟁사 URL에서 상품명, 소구점(감성/기능/가성비/디자인/편의성 등), 키워드, 가격대를 추출합니다.
2. 소구점마다 강도(1~10)를 매깁니다.
3. 사용자 상품과 비교하여 강점/약점/기회 영역을 분석합니다.
4. A/B 테스트에 활용할 수 있는 소구점을 제안합니다.

[출력 형식 (JSON)]
{
  "competitors": [
    {
      "url": "경쟁사 URL",
      "name": "상품명",
      "appealPoints": [{ "type": "감성", "summary": "설명", "strength": 8 }],
      "keywords": ["키워드1", "키워드2"],
      "priceRange": "15,000~20,000원"
    }
  ],
  "comparison": {
    "myStrengths": ["강점1", "강점2"],
    "competitorStrengths": ["경쟁사 강점1"],
    "opportunities": ["기회1", "기회2"],
    "suggestedAppealPoints": [{ "type": "가성비", "description": "설명" }]
  }
}
`;

    const userContent = `
[내 상품]
- 상품명: ${myProductName}
- 상품 정보: ${myProductInfo}

[경쟁사 URL 목록]
${competitorUrls.map((url, i) => `${i + 1}. ${url}`).join('\n')}

각 URL의 상품 정보를 분석하고 비교해 주세요.
`;

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userContent }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content;
        if (!content) return null;

        return JSON.parse(content) as BenchmarkResult;
    } catch (error) {
        console.error('Benchmark AI Error:', error);
        return null;
    }
}

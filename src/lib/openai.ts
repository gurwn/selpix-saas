
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

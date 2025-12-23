import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

// Create client only if key exists, helps avoiding build errors if env is missing locally
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export interface ProductRecommendation {
    optimizedName: string;
    alternativeNames: string[];
    keywords: string[];
    categorySuggestion: string;
}

export interface DiscountStrategy {
    originalPrice: number; // MSRP (Consumer Price)
    discountRate: number;  // Calculated % off
}

export interface PriceRecommendationInput {
    totalCost: number;
    feeRate: number;
    shippingCost: number;
    adOnOff: boolean;
    marketPrices: number[];
    candidatePrices: number[];
    unitCount?: number; // Added for Unit Price Calculation (default 1)
}

export interface PriceRecommendationResult {
    recommendedPrice: number;
    alternatives: number[];
    margins: { price: number; marginRate: number }[];
    discountStrategy?: DiscountStrategy; // Added
    reasoning?: string;
}

export class AIService {
    async generateProductMetadata(productContext: string | any): Promise<ProductRecommendation | null> {
        if (!openai) {
            console.error('OPENAI_API_KEY is missing');
            return null;
        }

        const systemPrompt = `
 당신은 쿠팡 상품등록 및 SEO 최적화 전문가입니다.
 입력된 도매 상품 정보를 바탕으로 "쿠팡 검색 알고리즘"에 최적화된 상품 정보를 생성하세요.

 [핵심 정책: 브랜드 안전 & 위너 회피]
 1. 브랜드 정책 (매우 중요):
    - 유명 브랜드(삼성, 나이키 등)가 아니라면, 절대 가짜 브랜드를 창조하지 마세요.
    - 브랜드가 불확실하면 "비브랜드(Generic)" 혹은 "상세페이지 참조"로 처리하세요.
 2. 위너 회피 (MOQ 세트 전략):
    - 도매꾹 최소구매수량(MOQ)이 2개 이상이거나 "세트" 구성인 경우, 반드시 상품명에 해당 수량을 명시하세요.
    - 예: "왕도매 칫솔" (MOQ 5) -> "왕도매 칫솔, 미세모, 5개입 세트"

 [상품명 생성 공식]
 구조: **[브랜드/비브랜드] + [핵심 상품명] + [핵심 속성/스펙] + [수량/구성]**
 
 [상세 규칙]
 1. **브랜드**: 공식 브랜드가 없으면 생략하거나 "비브랜드"로 간주 (상품명에 "비브랜드"라고 쓰진 말 것, 그냥 공란).
 2. **핵심 상품명**: 검색량이 높은 메인 키워드 위주 (장식적 수식어 제거).
 3. **핵심 속성**: 구매 결정에 중요한 스펙 (용량, 사이즈, 재질, 색상).
 4. **수량/구성**: 1개가 아니라면 반드시 표기 (예: 2개입, 5세트, 1+1).
 5. **금지어 필터링 (삭제 필수)**:
    - 홍보성: 최고, 1위, 최저가, 추천, 대박, 리뷰폭발, 주문폭주
    - 배송관련: 무료배송, 당일발송, 총알배송
    - 허위/과장: 효과보장, 만병통치, 특효

 [출력 형식 (JSON)]
 {
   "bestName": "공식에 맞춘 최적 상품명 (예: 셀픽스 초경량 접이식 캠핑 의자, 블랙, 1+1 세트)",
   "alternatives": ["대체 상품명 1", "대체 상품명 2", "대체 상품명 3"],
   "keywords": ["키워드1", "키워드2", ...] (중복 없는 검색용 태그 20개 - 상품명에 포함된 단어 제외 권장),
   "category": "추천 카테고리 (예: 스포츠/레저 > 캠핑 > 캠핑가구 > 캠핑의자)"
 }
 `;

        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: typeof productContext === 'string' ? productContext : JSON.stringify(productContext) }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.7
            });

            const content = completion.choices[0].message.content;
            if (!content) return null;

            const parsed = JSON.parse(content);
            return {
                optimizedName: parsed.bestName || '',
                alternativeNames: Array.isArray(parsed.alternatives) ? parsed.alternatives : [],
                keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
                categorySuggestion: parsed.category || ''
            };
        } catch (err) {
            console.error('OpenAI generation failed:', err);
            return null;
        }
    }

    async generatePriceRecommendation(input: PriceRecommendationInput): Promise<PriceRecommendationResult | null> {
        if (!openai) {
            console.error('OpenAI API Key missing');
            return null;
        }

        const systemPrompt = `
 당신은 쿠팡 판매가 최적화 전문가입니다.
 아래 입력값을 기반으로 "단위 가격(Unit Price)" 경쟁력과 "마진 방어"를 모두 충족하는 최적 판매가를 제안하세요.

 [핵심 전략: 단위 가격 우위]
 1. 공식: 단위 가격 = (판매가 / 총 수량) + 배송비
    - 소비자는 "개당 가격"이 낮은 상품을 선택합니다.
    - 예: 경쟁사가 1개 10,000원이면, 우리는 2개 19,000원(개당 9,500원)으로 설정하여 "가격 우위"를 점하세요.
 2. 마진 계산식 (정밀):
    - 순이익 = 판매가 - (상품원가 + 배송비 + 마켓수수료 + 반품버퍼 + 기타비용)
    - 마켓수수료: 입력된 수수료율 (기본 10.9%)
    - 반품버퍼: 판매가의 1~2% (반품/교환 리스크 충당)
    - 고정비 고려: 전체 마진에서 운영 고정비를 감안하여 너무 낮은 마진은 피하세요.

 [제안 규칙]
 1. **추천가 (Best)**: "단위 가격"이 경쟁사보다 낮으면서, 마진율 20% 이상 확보 가능한 가격.
 2. **최소가 (Min)**: 마진율 10~15% 선 (절대 손해 보지 않는 하한선).
    - 만약 경쟁사가 이보다 낮다면 "경고(Warning)" 메시지를 사유에 포함하세요 (역마진 경고).
 3. **최대가 (Max)**: 노출이 줄어들지 않는 선에서의 고마진 가격 (경쟁사 품절 시 적용 등).

 [할인 가격 전략]
 1. 소비자는 "할인율(%)"에 민감합니다. 판매가보다 높은 "정상가(출고가)"를 설정하여 할인 효과를 연출하세요.
 2. 제안: 판매가 대비 30~50% 높은 가격을 "정상가(originalPrice)"로 설정.
    - 예: 판매가 15,000원 -> 정상가 25,000원 (40% 할인 효과)

 [출력 형식 (JSON)]
 {
   "recommendedPrice": 15000,
   "originalPrice": 25000,
   "discountRate": 40,
   "alternatives": [14500, 16000],
   "margins": [
     { "price": 15000, "marginRate": 25.5 },
     { "price": 14500, "marginRate": 22.0 },
     { "price": 16000, "marginRate": 30.1 }
   ],
   "reasoning": "왜 이 가격이 최적인지 전략적 설명 (단, 구체적인 마진율(%) 수치는 언급하지 마세요. 프론트엔드 계산기가 실시간으로 보여줍니다.)"
 }
 `;

        const userContent = `
 [입력]
 - 상품원가(totalCost): ${input.totalCost}원
 - 쿠팡 수수료율: ${input.feeRate}%
 - 배송비: ${input.shippingCost}원
 - 광고비 적용여부: ${input.adOnOff ? 'ON' : 'OFF'}
 - 경쟁상품 상위 10개 가격: ${JSON.stringify(input.marketPrices)}
 - 예상판매가 후보군(배수 기반): ${JSON.stringify(input.candidatePrices)}
 - 구성 수량(MOQ 기반): ${input.unitCount || 1}개
 
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
}

export const aiService = new AIService();

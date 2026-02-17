export const ALL_FEATURES = [
  { key: "ai_analysis", label: "AI 분석", free: "월 5회", lite: "월 30회", pro: "월 100회", biz: "월 500회" },
  { key: "ab_test", label: "A/B 테스트", free: "2개", lite: "10개", pro: "무제한", biz: "무제한" },
  { key: "sourcing", label: "소싱 검색", free: "기본", lite: "도매꾹 연동", pro: "도매꾹 연동", biz: "도매꾹 연동" },
  { key: "benchmark", label: "경쟁사 벤치마킹", free: false, lite: "월 10회", pro: "월 50회", biz: "무제한" },
  { key: "coupang_register", label: "쿠팡 자동 등록", free: false, lite: false, pro: true, biz: true },
  { key: "report", label: "상세 리포트", free: false, lite: false, pro: true, biz: "맞춤 리포트" },
  { key: "support", label: "지원", free: "커뮤니티", lite: "이메일", pro: "우선 지원", biz: "전담 매니저" },
  { key: "api", label: "API 접근", free: false, lite: false, pro: false, biz: true },
] as const;

export type PlanKey = "free" | "lite" | "pro" | "biz";

export interface Plan {
  key: PlanKey;
  name: string;
  price: number;
  priceLabel: string;
  tierLevel: number;
  description: string;
  features: string[];
  popular?: boolean;
}

export const PLANS: Plan[] = [
  {
    key: "free",
    name: "FREE",
    price: 0,
    priceLabel: "무료",
    tierLevel: 0,
    description: "시작하기 좋은 무료 플랜",
    features: ["AI 분석 월 5회", "A/B 테스트 2개", "기본 소싱 검색", "커뮤니티 지원"],
  },
  {
    key: "lite",
    name: "LITE",
    price: 29000,
    priceLabel: "₩29,000/월",
    tierLevel: 1,
    description: "성장하는 셀러를 위한 플랜",
    features: ["AI 분석 월 30회", "A/B 테스트 10개", "도매꾹 연동", "경쟁사 벤치마킹 월 10회", "이메일 지원"],
    popular: true,
  },
  {
    key: "pro",
    name: "PRO",
    price: 79000,
    priceLabel: "₩79,000/월",
    tierLevel: 2,
    description: "전문 셀러를 위한 고급 기능",
    features: [
      "AI 분석 월 100회",
      "A/B 테스트 무제한",
      "도매꾹 연동",
      "경쟁사 벤치마킹 월 50회",
      "쿠팡 자동 등록",
      "상세 리포트",
      "우선 지원",
    ],
  },
  {
    key: "biz",
    name: "BIZ",
    price: 199000,
    priceLabel: "₩199,000/월",
    tierLevel: 3,
    description: "대형 셀러 & 팀을 위한 플랜",
    features: [
      "AI 분석 월 500회",
      "A/B 테스트 무제한",
      "도매꾹 연동",
      "경쟁사 벤치마킹 무제한",
      "쿠팡 자동 등록",
      "맞춤 리포트",
      "전담 매니저",
      "API 접근",
    ],
  },
];

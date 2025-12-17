/**
 * LemonSqueezy webhook 공통 유틸리티 함수
 * 특정 라이브러리에 의존하지 않는 순수 함수들
 */

/**
 * 플랜 변경 여부 확인
 * @param currentVariantId - 현재 variant ID
 * @param newVariantId - 새로운 variant ID
 * @returns 플랜 변경 여부
 */
export function isPlanChanged(
  currentVariantId: string,
  newVariantId: string | number
): boolean {
  return String(currentVariantId) !== String(newVariantId);
}

/**
 * Safe string 변환
 * @param value - 변환할 값
 * @returns 문자열 또는 null
 */
export function safeString(value: any): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return String(value);
}

/**
 * Safe number 변환
 * @param value - 변환할 값
 * @param defaultValue - 기본값
 * @returns 숫자
 */
export function safeNumber(value: any, defaultValue: number = 0): number {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * 플랜 타입별 기본 설정
 */
export const PLAN_DEFAULTS = {
  PERSONAL: {
    quantity: 1,
    subscriptionItemId: null as null,
  },
  TEAM: {
    minQuantity: 1,
  },
} as const;

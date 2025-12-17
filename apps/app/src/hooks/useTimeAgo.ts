import { formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";

/**
 * 주어진 날짜와 현재 시간의 차이를 현지화된 텍스트로 반환하는 hook
 * @param date - Date 객체
 * @param addSuffix - "전", "ago" 같은 접미사 추가 여부 (기본값: true)
 * @returns 현지화된 상대 시간 문자열
 *
 * @example
 * const timeAgo = useTimeAgo(new Date('2024-01-01'));
 * // 결과: "2 months ago" 또는 "2개월 전"
 *
 * const customTimeAgo = useTimeAgo(updatedAt, false);
 * // 결과: "2 months" 또는 "2개월"
 */
export function useTimeAgo(date: Date, addSuffix: boolean = true): string {
  const locale = useLocale();

  return formatDistanceToNow(date, {
    addSuffix,
    locale: locale === "ko" ? ko : enUS,
  });
}

import { routing } from "./routing";

// Export for backward compatibility
export const locales = routing.locales;
export const defaultLocale = routing.defaultLocale;

export type Locale = (typeof locales)[number];

// 한국 관련 국가 코드 (optional, for future geolocation features)
export const koreanCountries = ["KR", "KP"];

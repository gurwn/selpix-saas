import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";

export function formatDate(date: Date | string, locale: string = "ko") {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const dateLocale = locale === "ko" ? ko : enUS;
  
  return format(dateObj, "PPP", { locale: dateLocale });
}

export function formatDateTime(date: Date | string, locale: string = "ko") {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const dateLocale = locale === "ko" ? ko : enUS;
  
  return format(dateObj, "PPp", { locale: dateLocale });
}
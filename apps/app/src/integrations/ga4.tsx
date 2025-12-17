import { GoogleAnalytics } from "@next/third-parties/google";

export function GoogleAnalytics4() {
  if (!process.env.NEXT_PUBLIC_GA_ID) return null;
  return <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />;
}

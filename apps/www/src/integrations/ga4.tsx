import { GoogleAnalytics } from "@next/third-parties/google";

export function GoogleAnalytics4() {
  return <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />;
}

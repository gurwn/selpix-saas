"use client";

import { GoogleAnalytics4 } from "@/integrations/ga4";
import { Clarity } from "@/integrations/clarity";
import { DiscordFAB } from "@/components/DiscordFAB";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GoogleAnalytics4 />
      <Clarity />
      {children}
      <DiscordFAB />
    </>
  );
}

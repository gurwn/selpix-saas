import { Metadata } from "next";

import "@myapp/ui/globals.css";
import { TRPCProvider } from "@/utils/trpc/client";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@myapp/ui/components/sonner";
import localFont from "next/font/local";
import { GoogleAnalytics4 } from "@/integrations/ga4";
import { Clarity } from "@/integrations/clarity";

const pretendard = localFont({
  src: "./fonts/PretendardVariable.ttf",
  weight: "45 920",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  title: "SuperVoost Full SaaS",
  description: "Made by Vooster AI Template",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body
        className={`antialiased ${pretendard.variable} font-pretendard overflow-x-hidden`}
      >
        <GoogleAnalytics4 />
        <Clarity />
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ""}
        >
          <TRPCProvider>
            <main>{children}</main>
            <Toaster position="top-center" closeButton />
          </TRPCProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

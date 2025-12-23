import { LoadableContext } from "next/dist/shared/lib/loadable-context.shared-runtime";
import { Loader } from "lucide-react";
import { Suspense } from "react";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getMessages, setRequestLocale } from "next-intl/server";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthGuard } from "@/components/clerk/AuthGuard";
import { LayoutContent } from "./_client";
import { UserProvider } from "@/components/providers/user"; // Preserved but unused in original? Keeping it.

// Consolidated imports from Global Root Layout
import { Metadata } from "next";
import "@myapp/ui/globals.css";
import { TRPCProvider } from "@/utils/trpc/client";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@myapp/ui/components/sonner";
import localFont from "next/font/local";
import { GoogleAnalytics4 } from "@/integrations/ga4";
import { Clarity } from "@/integrations/clarity";

const pretendard = localFont({
  src: "../fonts/PretendardVariable.ttf",
  weight: "45 920",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  title: "SuperVoost Full SaaS",
  description: "Made by Vooster AI Template",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Ensure that the incoming `locale` is valid
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`antialiased ${pretendard.variable} font-pretendard overflow-x-hidden`}
        suppressHydrationWarning
      >
        <GoogleAnalytics4 />
        <Clarity />
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ""}
        >
          <TRPCProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <NextIntlClientProvider messages={messages}>
                <Suspense fallback={<Skeleton />}>
                  <AuthGuard fallback={<Skeleton />}>
                    <LayoutContent>{children}</LayoutContent>
                  </AuthGuard>
                </Suspense>
              </NextIntlClientProvider>
            </ThemeProvider>
            <Toaster position="top-center" closeButton />
          </TRPCProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

function Skeleton() {
  return (
    <div className="flex justify-center items-center w-full h-screen">
      <Loader className="animate-spin size-10" />
    </div>
  );
}

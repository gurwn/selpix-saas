import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ClientProviders } from "../client-providers";
import { Toaster } from "@myapp/ui/components/sonner";
import "@myapp/ui/globals.css";
import localFont from "next/font/local";

const pretendard = localFont({
  src: "../fonts/PretendardVariable.ttf",
  weight: "45 920",
  variable: "--font-pretendard",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`antialiased ${pretendard.variable} font-pretendard`}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ClientProviders>
            {children}
            <Toaster />
          </ClientProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

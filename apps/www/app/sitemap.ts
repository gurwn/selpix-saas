import { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://selpix-saas-app-gpmr.vercel.app";

    // Base routes
    const routes = ["", "/pricing", "/faq"];

    const sitemapEntries: MetadataRoute.Sitemap = [];

    routes.forEach((route) => {
        routing.locales.forEach((locale) => {
            sitemapEntries.push({
                url: `${baseUrl}/${locale}${route}`,
                lastModified: new Date(),
                changeFrequency: "weekly",
                priority: route === "" ? 1 : 0.8,
            });
        });
    });

    return sitemapEntries;
}

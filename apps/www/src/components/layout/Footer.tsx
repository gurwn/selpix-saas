"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DISCORD_LINK, FEEDBACK_LINK } from "@/constants/links";

export const Footer = () => {
  const t = useTranslations();

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-6xl px-4 py-12 mx-auto sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3 text-xl font-medium text-gray-950">
              ProductName
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-950">
              {t("footer.product.title")}
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link
                  href="#features"
                  className="transition-colors hover:text-gray-950"
                >
                  {t("footer.product.features")}
                </Link>
              </li>
              <li>
                <Link
                  href="#roadmap"
                  className="transition-colors hover:text-gray-950"
                >
                  {t("footer.product.roadmap")}
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="transition-colors hover:text-gray-950"
                >
                  {t("footer.product.pricing")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-950">
              {t("footer.resources.title")}
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a
                  href={DISCORD_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-gray-950"
                >
                  {t("footer.resources.community")}
                </a>
              </li>
              <li>
                <a
                  href={FEEDBACK_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-gray-950"
                >
                  {t("footer.resources.feedback")}
                </a>
              </li>
              <li>
                <a
                  href="mailto:lead@awesome.dev"
                  className="transition-colors hover:text-gray-950"
                >
                  {t("footer.resources.support")}
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-950">
              {t("footer.social.title")}
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-gray-950"
                >
                  {t("footer.social.threads")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-gray-950"
                >
                  {t("footer.social.instagram")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-gray-200">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="order-2 text-sm text-gray-600 md:order-1">
              {t("footer.copyright")}
            </div>

            <div className="flex items-center order-1 gap-6 text-sm text-gray-600 md:order-2">
              <Link
                href="/privacy"
                className="transition-colors hover:text-gray-950"
              >
                {t("footer.legal.privacy")}
              </Link>
              <Link
                href="/terms"
                className="transition-colors hover:text-gray-950"
              >
                {t("footer.legal.terms")}
              </Link>
              <a
                href="mailto:lead@awesome.dev"
                className="transition-colors hover:text-gray-950"
              >
                {t("footer.company.contact")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

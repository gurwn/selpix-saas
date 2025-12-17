"use client";

import { useTranslations } from "next-intl";
import { Button } from "@myapp/ui/components/button";
import { Sheet, SheetContent, SheetTrigger } from "@myapp/ui/components/sheet";
import { Menu } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { DISCORD_LINK } from "@/constants/links";
import { moveToGetStarted, moveToSignIn } from "@/lib/moveToApp";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export const Header = () => {
  const t = useTranslations();

  const handleGetStartedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    moveToGetStarted();
  };

  const menuItems = [
    { name: t("header.home"), href: "#" },
    { name: t("header.features"), href: "#features" },
    { name: t("header.faq"), href: "#faq" },
    { name: t("header.pricing"), href: "#pricing" },
    { name: t("common.community"), href: DISCORD_LINK, target: "_blank" },
  ];

  return (
    <header className="z-50 w-full bg-white border-b border-gray-200">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-[6px]">
              <Image
                src="/logo.svg"
                alt="logo"
                width={32}
                height={32}
                className="size-7"
              />
              <span className="text-xl font-bold text-gray-900">
                ProductName
              </span>
            </Link>
          </div>

          {/* 데스크톱 메뉴 */}
          <nav className="items-center hidden space-x-8 md:flex">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                target={item.target}
                className="p-2 text-gray-500 transition-colors duration-200 rounded-md hover:text-gray-900 hover:bg-gray-100"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* 데스크톱 버튼 */}
          <div className="items-center hidden space-x-4 md:flex">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              onClick={() => {
                moveToSignIn();
              }}
            >
              {t("common.signIn")}
            </Button>
            <Button
              onClick={(e) => {
                handleGetStartedClick(e);
              }}
            >
              {t("common.getStarted")}
            </Button>
          </div>

          {/* 모바일 메뉴 */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                  <span className="sr-only">{t("header.menuOpen")}</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[280px] sm:w-[320px] flex flex-col"
              >
                <div className="flex flex-col h-full">
                  {/* 로고 영역 - 상단 고정 */}
                  <div className="flex items-center px-6 py-4 border-b border-slate-100">
                    <Image
                      src="/logo.svg"
                      alt="logo"
                      width={32}
                      height={32}
                      className="size-7"
                    />
                    <span className="ml-[6px] text-xl font-bold text-slate-900">
                      ProductName
                    </span>
                  </div>

                  {/* 메뉴 영역 - 중앙 정렬 및 확장 */}
                  <nav className="flex-1 px-4 py-6">
                    <ul className="space-y-1">
                      {menuItems.map((item) => (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            target={item.target}
                            className="flex items-center px-4 py-3 text-sm font-medium text-slate-700 rounded-md transition-all hover:bg-slate-100 hover:text-slate-900"
                          >
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>

                  {/* 하단 액션 영역 */}
                  <div className="px-4 py-6 space-y-4 border-t border-slate-100">
                    <div className="flex justify-center mb-2">
                      <LanguageSwitcher />
                    </div>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          moveToSignIn();
                        }}
                      >
                        {t("common.signIn")}
                      </Button>
                      <Button
                        className="w-full"
                        onClick={(e) => {
                          handleGetStartedClick(e);
                        }}
                      >
                        {t("common.getStarted")}
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

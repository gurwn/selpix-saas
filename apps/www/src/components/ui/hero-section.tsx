"use client";

import { useState } from "react";
import { Button } from "@myapp/ui/components/button";
import { Badge } from "@myapp/ui/components/badge";
import { ArrowRightIcon, Play } from "lucide-react";
import { Mockup, MockupFrame } from "@/components/ui/mockup";
import { Glow } from "@/components/ui/glow";
import { TutorialModal } from "@/components/ui/tutorial-modal";
import Image from "next/image";
import { useTheme } from "next-themes";
import { cn } from "@myapp/ui/lib/utils";

interface HeroAction {
  text: string;
  href: string;
  icon?: React.ReactNode;
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "ghost"
    | "link"
    | "destructive"
    | "discord";
  onClick?: (e: React.MouseEvent) => void;
}

interface HeroProps {
  badge?: {
    text: string;
    action?: {
      text: string;
      href: string;
    };
  };
  title: string;
  description: string;
  tutorial: string;
  actions: HeroAction[];
  image: {
    light: string;
    dark: string;
    alt: string;
  };
  className?: string;
}

export function HeroSection({
  badge,
  title,
  description,
  tutorial,
  actions,
  image,
  className,
}: HeroProps) {
  const { resolvedTheme } = useTheme();
  const imageSrc = resolvedTheme === "light" ? image.light : image.dark;
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);

  const handleTutorialClick = () => {
    setIsTutorialModalOpen(true);
  };

  return (
    <>
      <section
        className={cn(
          "bg-background text-foreground",
          "py-12 sm:py-24 md:py-32 px-4",
          "fade-bottom overflow-hidden pb-0",
          className
        )}
      >
        <div className="flex flex-col max-w-6xl gap-12 pt-6 mx-auto sm:gap-24">
          <div className="flex flex-col items-center gap-6 text-center sm:gap-10">
            {/* Badge */}
            {badge && (
              <Badge
                variant="outline"
                className="gap-2 scale-125 animate-appear"
              >
                <span className="text-muted-foreground">{badge.text}</span>
                {badge.action != null && (
                  <a
                    href={badge.action.href}
                    className="flex items-center gap-1 underline"
                  >
                    {badge.action.text}
                    <ArrowRightIcon className="w-3 h-3" />
                  </a>
                )}
              </Badge>
            )}

            {/* Title */}
            <h1 className="relative z-10 inline-block text-4xl font-semibold leading-tight text-transparent whitespace-pre-line animate-appear bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text drop-shadow-2xl sm:text-5xl sm:leading-tight md:text-6xl md:leading-tight lg:text-7xl lg:leading-tight xl:text-8xl xl:leading-tight">
              {title}
            </h1>

            <div className="flex flex-col gap-4">
              {/* Description */}
              <p className="text-md relative z-10 max-w-[550px] animate-appear font-medium text-muted-foreground/70 opacity-0 delay-100 sm:text-xl whitespace-pre-line">
                {description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative z-10 flex justify-center gap-4 delay-300 opacity-0 animate-appear">
                <div className="relative z-10 flex justify-center gap-4 delay-300 opacity-0 animate-appear">
                  {actions.map((action) => (
                    <Button
                      key={`${action.href}-${action.text}`}
                      variant={
                        action.variant === "discord"
                          ? "default"
                          : action.variant
                      }
                      size="lg"
                      asChild
                      className={
                        action.variant === "discord"
                          ? "text-[#5865F2] bg-white border border-gray-300 hover:text-white hover:bg-[#5865F2] hover:border-[#5865F2]"
                          : ""
                      }
                    >
                      <a
                        href={action.href}
                        className="flex items-center gap-2"
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                          if (action.onClick) {
                            action.onClick(e);
                          }
                        }}
                      >
                        {action.icon}
                        {action.text}
                      </a>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Tutorial Button */}
              <div className="relative z-10 delay-500 opacity-0 animate-appear">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleTutorialClick}
                  className="flex items-center gap-2 transition-all duration-200 text-muted-foreground border-muted-foreground/30 hover:bg-muted/50 hover:text-red-400 hover:border-muted-foreground/60"
                >
                  <Play className="w-4 h-4 text-red-500" />
                  {tutorial}
                </Button>
              </div>
            </div>

            {/* Image with Glow */}
            <div className="relative pt-2">
              <MockupFrame
                className="delay-700 opacity-0 animate-appear"
                size="small"
              >
                <Mockup type="responsive">
                  <Image
                    src={imageSrc}
                    alt={image.alt}
                    width={1248}
                    height={765}
                    priority
                  />
                </Mockup>
              </MockupFrame>
              <Glow
                variant="top"
                className="delay-1000 opacity-0 animate-appear-zoom"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tutorial Modal */}
      <TutorialModal
        isOpen={isTutorialModalOpen}
        onClose={() => setIsTutorialModalOpen(false)}
      />
    </>
  );
}

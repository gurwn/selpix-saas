import { ReactNode } from "react";
import { ArrowRightIcon } from "lucide-react";
import { LucideIcon } from "lucide-react";

import { cn } from "@myapp/ui/lib/utils";
import { Button } from "@myapp/ui/components/button";

const BentoGrid = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
        className
      )}
    >
      {children}
    </div>
  );
};

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
}: {
  name: string;
  className: string;
  background?: ReactNode;
  Icon?: LucideIcon;
  description: ReactNode;
  href?: string;
  cta?: string;
}) => {
  return (
    <div
      key={name}
      className={cn(
        "group relative col-span-1 md:col-span-2 lg:col-span-3 flex flex-col justify-between overflow-hidden rounded-xl",
        "h-fit sm:h-auto",
        "pt-10",
        // light styles
        "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
        className
      )}
    >
      {background != null && <div>{background}</div>}

      <div
        className={cn(
          "z-10 flex flex-col mt-auto gap-1 p-6 transition-all duration-300 pointer-events-none transform-gpu",
          href != null && cta != null && "group-hover:-translate-y-10"
        )}
      >
        {Icon != null && (
          <Icon className="transition-all duration-300 ease-in-out origin-left size-6 transform-gpu text-neutral-700/25 group-hover:scale-75" />
        )}
        <h3 className="text-xl font-semibold text-neutral-700">{name}</h3>
        <p className="max-w-lg text-neutral-400">{description}</p>
      </div>

      <div
        className={cn(
          "pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
        )}
      >
        {href != null && cta != null && (
          <Button
            variant="ghost"
            asChild
            size="sm"
            className="pointer-events-auto"
          >
            <a href={href} target="_blank" rel="noreferrer">
              {cta}
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </a>
          </Button>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[.03]" />
    </div>
  );
};

export { BentoCard, BentoGrid };

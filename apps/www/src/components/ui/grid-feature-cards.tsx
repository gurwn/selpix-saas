import { cn } from "@myapp/ui/lib/utils";
import React from "react";

type FeatureType = {
  title: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: React.ReactNode;
};

type FeatureCardPorps = React.ComponentProps<"div"> & {
  feature: FeatureType;
};

export function FeatureCard({
  feature,
  className,
  ...props
}: FeatureCardPorps) {
  const p = genRandomPattern();

  return (
    <div
      className={cn(
        "group relative overflow-hidden p-6 border border-dashed border-gray-300 rounded-lg hover:shadow-lg transition-all hover:border-brand/50",
        className
      )}
      {...props}
    >
      <div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)]">
        <div className="from-foreground/5 to-foreground/1 absolute inset-0 bg-gradient-to-r [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] opacity-100">
          <GridPattern
            width={20}
            height={20}
            x="-12"
            y="4"
            squares={p}
            className="absolute inset-0 w-full h-full transition-all fill-foreground/5 stroke-foreground/25 mix-blend-overlay group-hover:fill-brand/25 group-hover:stroke-brand/55"
          />
        </div>
      </div>
      {feature.icon != null ? (
        <feature.icon
          className="transition-all text-foreground/75 size-6 group-hover:text-foreground"
          strokeWidth={1}
          aria-hidden
        />
      ) : (
        <div className="size-6" />
      )}
      <h3
        className={cn(
          "text-xl font-semibold md:text-2xl",
          feature.icon ? "mt-10" : "mt-4"
        )}
      >
        {feature.title}
      </h3>
      <p className="relative z-20 mt-4 text-lg font-light text-gray-600 whitespace-pre-line">
        {feature.description}
      </p>
    </div>
  );
}

function GridPattern({
  width,
  height,
  x,
  y,
  squares,
  ...props
}: React.ComponentProps<"svg"> & {
  width: number;
  height: number;
  x: string;
  y: string;
  squares?: number[][];
}) {
  const patternId = React.useId();

  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        strokeWidth={0}
        fill={`url(#${patternId})`}
      />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map((square, index) => (
            <rect
              strokeWidth="0"
              key={index}
              width={width + 1}
              height={height + 1}
              x={square[0]! * width}
              y={square[1]! * height}
            />
          ))}
        </svg>
      )}
    </svg>
  );
}

function genRandomPattern(length?: number): number[][] {
  length = length ?? 5;
  return Array.from({ length }, () => [
    Math.floor(Math.random() * 4) + 7, // random x between 7 and 10
    Math.floor(Math.random() * 6) + 1, // random y between 1 and 6
  ]);
}

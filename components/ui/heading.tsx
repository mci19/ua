import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const headingVariants = cva("font-semibold tracking-tight", {
  variants: {
    level: {
      title: "text-title font-bold",
      header: "text-header",
      subheader: "text-label uppercase tracking-wide",
    },
    tone: {
      navy: "text-ua-navy",
      foreground: "text-foreground",
      muted: "text-muted-foreground",
      white: "text-white",
    },
  },
  defaultVariants: { level: "title", tone: "navy" },
});

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";

interface HeadingProps
  extends VariantProps<typeof headingVariants>,
    Omit<React.HTMLAttributes<HTMLHeadingElement>, "color"> {
  as?: HeadingTag;
}

export function Heading({
  as: Comp = "h2",
  level,
  tone,
  className,
  ...rest
}: HeadingProps) {
  return (
    <Comp className={cn(headingVariants({ level, tone }), className)} {...rest} />
  );
}

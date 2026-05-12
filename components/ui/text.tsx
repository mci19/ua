import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const textVariants = cva("", {
  variants: {
    size: {
      body: "text-body",
      label: "text-label",
      small: "text-small",
    },
    tone: {
      foreground: "text-foreground",
      muted: "text-muted-foreground",
      navy: "text-ua-navy",
      red: "text-ua-red",
      success: "text-success",
      warning: "text-warning",
      white: "text-white",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
  },
  defaultVariants: { size: "body", tone: "foreground", weight: "normal" },
});

type TextTag = "p" | "span" | "div" | "label" | "small" | "strong";

interface TextProps
  extends VariantProps<typeof textVariants>,
    Omit<React.HTMLAttributes<HTMLElement>, "color"> {
  as?: TextTag;
}

export function Text({
  as: Comp = "p",
  size,
  tone,
  weight,
  className,
  ...rest
}: TextProps) {
  return (
    <Comp
      className={cn(textVariants({ size, tone, weight }), className)}
      {...rest}
    />
  );
}

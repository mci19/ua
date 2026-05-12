import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

// Vertical layout primitive. Gap is normalised across the app so spacing
// stays consistent: xs=8, sm=12, md=20, lg=32, xl=48.
const stackVariants = cva("flex flex-col", {
  variants: {
    gap: {
      none: "gap-0",
      xs: "gap-2",
      sm: "gap-3",
      md: "gap-5",
      lg: "gap-8",
      xl: "gap-12",
    },
    align: {
      stretch: "items-stretch",
      center: "items-center",
      start: "items-start",
      end: "items-end",
    },
  },
  defaultVariants: { gap: "md", align: "stretch" },
});

type DivTag = "div" | "section" | "article" | "ul" | "ol" | "form" | "nav";

interface StackProps
  extends VariantProps<typeof stackVariants>,
    React.HTMLAttributes<HTMLElement> {
  as?: DivTag;
}

export function Stack({ as: Comp = "div", gap, align, className, ...rest }: StackProps) {
  return (
    <Comp className={cn(stackVariants({ gap, align }), className)} {...rest} />
  );
}

// Horizontal layout primitive that wraps. Use Cluster for groups of
// buttons / chips / inline metadata.
const clusterVariants = cva("flex flex-wrap items-center", {
  variants: {
    gap: {
      none: "gap-0",
      xs: "gap-2",
      sm: "gap-3",
      md: "gap-4",
      lg: "gap-6",
    },
    justify: {
      start: "justify-start",
      end: "justify-end",
      center: "justify-center",
      between: "justify-between",
    },
  },
  defaultVariants: { gap: "sm", justify: "start" },
});

interface ClusterProps
  extends VariantProps<typeof clusterVariants>,
    React.HTMLAttributes<HTMLElement> {
  as?: DivTag;
}

export function Cluster({ as: Comp = "div", gap, justify, className, ...rest }: ClusterProps) {
  return (
    <Comp className={cn(clusterVariants({ gap, justify }), className)} {...rest} />
  );
}

"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

// Every variant is a filled button with a white label. White text is set on
// the base classes (not per variant) so the colour applies even when the
// Button wraps a <Link> via `asChild` — Tailwind's preflight `a {
// color: inherit }` rule is overridden by a class on the element itself.
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded font-medium",
    "text-white transition-colors",
    "disabled:pointer-events-none disabled:opacity-60",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  ].join(" "),
  {
    variants: {
      intent: {
        primary:
          "bg-ua-navy hover:bg-ua-navy-600 active:bg-ua-navy-700 focus-visible:ring-ua-navy",
        secondary:
          "bg-ua-red hover:bg-ua-red-600 active:bg-ua-red-700 focus-visible:ring-ua-red",
        subtle:
          "bg-slate-600 hover:bg-slate-700 active:bg-slate-800 focus-visible:ring-slate-600",
        danger:
          "bg-ua-red hover:bg-ua-red-600 active:bg-ua-red-700 focus-visible:ring-ua-red",
        onDark:
          "bg-white/10 hover:bg-white/20 active:bg-white/25 focus-visible:ring-white",
      },
      size: {
        sm: "h-9 px-3 text-small",
        md: "h-11 px-5 text-label",
        lg: "h-12 px-6 text-body",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: { intent: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, intent, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ intent, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };

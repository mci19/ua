"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

// Every variant is a filled button with a white label. Use `intent` to pick
// the colour. There is intentionally no "ghost" or "link" variant on light
// backgrounds — for inline anchor text, use the <a> element directly with
// className="ua-link". For dark backgrounds (e.g. Topbar) pass intent="onDark".
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded font-medium transition-colors disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ua-navy focus-visible:ring-offset-2",
  {
    variants: {
      intent: {
        primary: "bg-ua-navy text-white hover:bg-ua-navy-600 active:bg-ua-navy-700",
        secondary:
          "bg-ua-red text-white hover:bg-ua-red-600 active:bg-ua-red-700",
        subtle:
          "bg-slate-600 text-white hover:bg-slate-700 active:bg-slate-800",
        danger:
          "bg-ua-red text-white hover:bg-ua-red-600 active:bg-ua-red-700",
        onDark:
          "bg-white/10 text-white hover:bg-white/20 active:bg-white/25",
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

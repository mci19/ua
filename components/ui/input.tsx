import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded border border-input bg-white px-3 py-2 text-label",
        "placeholder:text-muted-foreground",
        "focus-visible:border-ua-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ua-navy/40",
        "disabled:cursor-not-allowed disabled:bg-ua-gray-ultralight disabled:opacity-70",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

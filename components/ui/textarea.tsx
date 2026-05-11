import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[120px] w-full rounded border border-input bg-white px-3 py-2 text-label",
        "placeholder:text-muted-foreground",
        "focus-visible:border-ua-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ua-navy/40",
        "disabled:cursor-not-allowed disabled:bg-ua-gray-ultralight disabled:opacity-70",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

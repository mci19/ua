import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// We define custom font-size utilities in tailwind.config.ts:
//   text-title / text-header / text-body / text-label / text-small
// tailwind-merge doesn't know about those by default — it sees `text-*`
// and assumes it's a colour utility. Without this teach-step, a class
// list like "text-white text-label" would dedupe `text-white` away and
// leave only the font-size, so the button text falls back to the body
// `text-foreground` colour. That's the real reason the demo buttons
// looked like they had dark labels.
//
// Tell twMerge these names belong to the `font-size` group so they no
// longer conflict with colour utilities.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["title", "header", "body", "label", "small"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

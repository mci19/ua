import { cn } from "@/lib/utils/cn";

type Size = "sm" | "md" | "lg" | "xl";

const SIZES: Record<Size, { tile: string; svg: string; text: string; gap: string }> = {
  sm: { tile: "h-8 w-8", svg: "h-5 w-5", text: "text-small", gap: "gap-2" },
  md: { tile: "h-10 w-10", svg: "h-6 w-6", text: "text-small", gap: "gap-3" },
  lg: { tile: "h-16 w-16", svg: "h-10 w-10", text: "text-header", gap: "gap-4" },
  xl: { tile: "h-24 w-24", svg: "h-16 w-16", text: "text-title", gap: "gap-5" },
};

interface UALogoProps {
  className?: string;
  variant?: "light" | "dark";
  size?: Size;
  // Apply extra classes to the wordmark — set "hidden sm:flex" to hide it on
  // narrow screens.
  wordmarkClassName?: string;
}

export function UALogo({
  className,
  variant = "light",
  size = "md",
  wordmarkClassName,
}: UALogoProps) {
  const fg = variant === "light" ? "text-white" : "text-ua-navy";
  const s = SIZES[size];
  return (
    <div className={cn("flex items-center", s.gap, className)}>
      <span
        className={cn("grid shrink-0 place-items-center rounded bg-ua-red text-white", s.tile)}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className={s.svg} fill="currentColor">
          <path d="M6 4v9a6 6 0 0 0 12 0V4h-3v9a3 3 0 0 1-6 0V4H6Zm0 14v2h12v-2H6Z" />
        </svg>
      </span>
      <div
        className={cn(
          "flex flex-col leading-tight font-semibold tracking-wide",
          fg,
          s.text,
          wordmarkClassName,
        )}
      >
        <span>Universiteit</span>
        <span>Antwerpen</span>
      </div>
    </div>
  );
}

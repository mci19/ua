import Image from "next/image";
import { cn } from "@/lib/utils/cn";

type Size = "sm" | "md" | "lg" | "xl";

// Native aspect ratio of public/assets/ua-logo.png is ~3.52:1.
const SIZES: Record<Size, string> = {
  sm: "h-8",
  md: "h-10",
  lg: "h-16",
  xl: "h-24",
};

interface UALogoProps {
  className?: string;
  size?: Size;
  // The official logo's wordmark is dark navy. On a dark background you want
  // a white pill/card behind it. Pass extra classes here to add a background.
  badgeClassName?: string;
  priority?: boolean;
}

export function UALogo({ className, size = "md", badgeClassName, priority }: UALogoProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center",
        badgeClassName,
        className,
      )}
    >
      <Image
        src="/assets/ua-logo.png"
        alt="Universiteit Antwerpen"
        width={950}
        height={270}
        priority={priority}
        className={cn("w-auto", SIZES[size])}
      />
    </span>
  );
}

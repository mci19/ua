import { cn } from "@/lib/utils/cn";

export function UALogo({ className, variant = "light" }: { className?: string; variant?: "light" | "dark" }) {
  const fg = variant === "light" ? "text-white" : "text-ua-navy";
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        className="grid h-10 w-10 place-items-center rounded bg-ua-red text-white"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
          <path d="M6 4v9a6 6 0 0 0 12 0V4h-3v9a3 3 0 0 1-6 0V4H6Zm0 14v2h12v-2H6Z" />
        </svg>
      </span>
      <div className={cn("flex flex-col leading-tight", fg)}>
        <span className="text-small font-semibold tracking-wide">Universiteit</span>
        <span className="text-small font-semibold tracking-wide">Antwerpen</span>
      </div>
    </div>
  );
}

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function LoadingSpinner({ className, label = "Bezig met laden" }: { className?: string; label?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-ua-navy", className)} role="status">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span className="text-small">{label}</span>
    </div>
  );
}

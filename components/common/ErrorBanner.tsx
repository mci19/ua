"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface ErrorBannerProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorBanner({
  title = "Er ging iets mis",
  message = "Probeer het opnieuw of contacteer de beheerder.",
  onRetry,
  className,
}: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded border border-ua-red/30 bg-ua-red/5 p-4 text-ua-red",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-label font-semibold">{title}</p>
        <p className="text-small text-foreground/80">{message}</p>
      </div>
      {onRetry ? (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Opnieuw proberen
        </Button>
      ) : null}
    </div>
  );
}

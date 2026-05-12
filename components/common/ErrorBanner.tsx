"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
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
        "flex items-start gap-3 rounded border border-ua-red/30 bg-ua-red/5 p-4",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-ua-red" aria-hidden="true" />
      <div className="flex-1 space-y-1">
        <Text size="label" tone="red" weight="semibold">
          {title}
        </Text>
        <Text size="small" tone="foreground">
          {message}
        </Text>
      </div>
      {onRetry ? (
        <Button intent="subtle" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Opnieuw proberen
        </Button>
      ) : null}
    </div>
  );
}

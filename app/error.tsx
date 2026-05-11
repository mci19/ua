"use client";

import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled UI error", error);
  }, [error]);
  return (
    <div className="container py-12">
      <ErrorBanner
        title="Er ging iets mis"
        message="We konden deze pagina niet laden. Probeer het opnieuw of ga terug."
        onRetry={reset}
      />
      <div className="mt-6 flex gap-3">
        <Button asChild variant="secondary">
          <Link href="/">Naar de startpagina</Link>
        </Button>
      </div>
    </div>
  );
}

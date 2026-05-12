"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { Stack } from "@/components/ui/stack";
import { Text } from "@/components/ui/text";

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
      <Stack gap="md">
        <ErrorBanner
          title="Er ging iets mis"
          message={
            error.digest
              ? `We konden deze pagina niet laden (foutcode: ${error.digest}).`
              : "We konden deze pagina niet laden."
          }
          onRetry={reset}
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild intent="subtle">
            <Link href="/">Naar de startpagina</Link>
          </Button>
          <Button asChild intent="primary">
            <Link href="/api/health" target="_blank">
              Diagnose openen (/api/health)
            </Link>
          </Button>
        </div>
        <Text size="small" tone="muted">
          Als deze fout blijft komen, controleer dan via <code>/api/health</code> of de
          env-vars correct staan op Netlify (vooral <code>UA_DEMO_MODE</code> en{" "}
          <code>AUTH_SECRET</code>) en bekijk de Netlify Function-logs op de bovenstaande
          foutcode.
        </Text>
      </Stack>
    </div>
  );
}

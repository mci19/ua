"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { Stack } from "@/components/ui/stack";
import { Text } from "@/components/ui/text";

export default function NewRequestError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("NewRequest segment crash", error);
  }, [error]);
  return (
    <div className="container py-12">
      <Stack gap="md">
        <ErrorBanner
          title="Aanvraag kon niet worden geladen"
          message={
            error.digest
              ? `We konden dit formulier niet laden (foutcode: ${error.digest}).`
              : "We konden dit formulier niet laden."
          }
          onRetry={reset}
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild intent="subtle">
            <Link href="/aanvragen/nieuw">Terug naar keuzemenu</Link>
          </Button>
          <Button asChild intent="primary">
            <Link href="/">Naar de startpagina</Link>
          </Button>
        </div>
        <Text size="small" tone="muted">
          Deel <code>{error.digest ?? "(geen digest)"}</code> als je hulp nodig hebt
          — de Netlify Function-logs bevatten de volledige stacktrace.
        </Text>
      </Stack>
    </div>
  );
}

"use client";

import { ErrorBanner } from "@/components/common/ErrorBanner";

export default function WizardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container py-12">
      <ErrorBanner
        title="Kon dossier niet laden"
        message={error.message || "Probeer het opnieuw."}
        onRetry={reset}
      />
    </div>
  );
}

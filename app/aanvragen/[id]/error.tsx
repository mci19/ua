"use client";

import { useTranslations } from "next-intl";
import { ErrorBanner } from "@/components/common/ErrorBanner";

export default function WizardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");
  return (
    <div className="container py-12">
      <ErrorBanner
        title={t("couldNotLoadDossier")}
        message={error.message || t("retry")}
        onRetry={reset}
      />
    </div>
  );
}

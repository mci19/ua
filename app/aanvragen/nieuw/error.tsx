"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("errors");
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("NewRequest segment crash", error);
  }, [error]);
  return (
    <div className="container py-12">
      <Stack gap="md">
        <ErrorBanner
          title={t("couldNotLoadRequest")}
          message={
            error.digest ? t("couldNotLoadFormCode", { digest: error.digest }) : t("couldNotLoadForm")
          }
          onRetry={reset}
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild intent="subtle">
            <Link href="/aanvragen/nieuw">{t("backToPicker")}</Link>
          </Button>
          <Button asChild intent="primary">
            <Link href="/">{t("homeButton")}</Link>
          </Button>
        </div>
        <Text size="small" tone="muted">
          {t("newRequestSegmentDiag", { digest: error.digest ?? "(geen digest)" })}
        </Text>
      </Stack>
    </div>
  );
}

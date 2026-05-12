"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("errors");
  useEffect(() => {
    // Browser-side: the structured logger isn't available, so we keep
    // console.error here. The error has already been captured server-side
    // (and forwarded to Sentry if enabled).
    // eslint-disable-next-line no-console
    console.error("Unhandled UI error", error);
  }, [error]);
  return (
    <div className="container py-12">
      <Stack gap="md">
        <ErrorBanner
          title={t("title")}
          message={
            error.digest ? t("couldNotLoadCode", { digest: error.digest }) : t("couldNotLoad")
          }
          onRetry={reset}
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild intent="subtle">
            <Link href="/">{t("homeButton")}</Link>
          </Button>
          <Button asChild intent="primary">
            <Link href="/api/health" target="_blank">
              {t("diagButton")}
            </Link>
          </Button>
        </div>
        <Text size="small" tone="muted">
          {t("diagFooter")}
        </Text>
      </Stack>
    </div>
  );
}

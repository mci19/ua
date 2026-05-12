import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Topbar } from "@/components/common/Topbar";
import { SignOutForm } from "@/components/common/SignOutForm";
import { PageShell } from "@/components/common/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Stack } from "@/components/ui/stack";
import { Text } from "@/components/ui/text";

export const dynamic = "force-dynamic";

export default async function UnknownUserPage() {
  const t = await getTranslations("unknownUser");
  return (
    <>
      <Topbar title={t("topbarTitle")} rightSlot={<SignOutForm />} />
      <PageShell>
        <Card className="mx-auto max-w-2xl">
          <CardContent className="p-8">
            <Stack gap="lg">
              <Heading level="title">{t("title")}</Heading>
              <Text tone="muted">{t("description")}</Text>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild intent="subtle" size="lg">
                  <Link href="/">{t("back")}</Link>
                </Button>
                <Button asChild intent="primary" size="lg">
                  <Link
                    href="https://www.uantwerpen.be/sisa"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("goToSisa")}
                  </Link>
                </Button>
              </div>
            </Stack>
          </CardContent>
        </Card>
      </PageShell>
    </>
  );
}

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Topbar } from "@/components/common/Topbar";
import { SignOutForm } from "@/components/common/SignOutForm";
import { PageShell } from "@/components/common/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Stack } from "@/components/ui/stack";
import { Text } from "@/components/ui/text";
import { WizardActions } from "@/components/ui/wizard-actions";
import { routes } from "@/lib/constants/routes";
import { FILE_TYPE_CODE } from "@/lib/constants/dossierTypes";

export default async function ScenarioFourPage() {
  const t = await getTranslations("socialAllowance");
  return (
    <>
      <Topbar
        title={t("scenarioTopbarTitle")}
        showBack
        backHref={routes.newSocialAllowance}
        rightSlot={<SignOutForm />}
      />
      <PageShell>
        <Card className="mx-auto max-w-2xl">
          <CardContent className="p-8">
            <Stack gap="md">
              <Heading level="header">{t("scenarioTitle")}</Heading>
              <Text tone="muted">{t("scenarioDescription")}</Text>
              <WizardActions>
                <Button asChild intent="subtle" size="lg">
                  <Link href={routes.newSocialAllowance}>{t("scenarioPrev")}</Link>
                </Button>
                <Button asChild intent="primary" size="lg">
                  <Link
                    href={`/aanvragen/nieuw/sociale-toelage/${FILE_TYPE_CODE.VERMOEDE_VAN_TEKORT}`}
                  >
                    {t("scenarioStart")}
                  </Link>
                </Button>
              </WizardActions>
            </Stack>
          </CardContent>
        </Card>
      </PageShell>
    </>
  );
}

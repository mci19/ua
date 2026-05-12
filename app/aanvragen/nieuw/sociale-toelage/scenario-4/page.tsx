import Link from "next/link";
import { Topbar, SignOutButton } from "@/components/common/Topbar";
import { PageShell } from "@/components/common/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Stack } from "@/components/ui/stack";
import { Text } from "@/components/ui/text";
import { WizardActions } from "@/components/ui/wizard-actions";
import { routes } from "@/lib/constants/routes";
import { FILE_TYPE_CODE } from "@/lib/constants/dossierTypes";

export default function ScenarioFourPage() {
  return (
    <>
      <Topbar
        title="Sociale toelage – vermoede van tekort"
        showBack
        backHref={routes.newSocialAllowance}
        rightSlot={<SignOutButton />}
      />
      <PageShell>
        <Card className="mx-auto max-w-2xl">
          <CardContent className="p-8">
            <Stack gap="md">
              <Heading level="header">
                Je situatie vraagt om een uitgebreidere beoordeling.
              </Heading>
              <Text tone="muted">
                Vul het formulier verder in. Een dossierbeheerder zal je aanvraag
                manueel opvolgen en je via berichten op de hoogte houden.
              </Text>
              <WizardActions>
                <Button asChild intent="subtle" size="lg">
                  <Link href={routes.newSocialAllowance}>Vorige stap</Link>
                </Button>
                <Button asChild intent="primary" size="lg">
                  <Link
                    href={`/aanvragen/nieuw/sociale-toelage/${FILE_TYPE_CODE.VERMOEDE_VAN_TEKORT}`}
                  >
                    Formulier starten
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

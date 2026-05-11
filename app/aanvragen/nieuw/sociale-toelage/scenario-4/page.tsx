import Link from "next/link";
import { Topbar, SignOutButton } from "@/components/common/Topbar";
import { PageShell } from "@/components/common/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
          <CardContent className="space-y-4 p-8">
            <h2 className="text-header text-ua-navy">
              Je situatie vraagt om een uitgebreidere beoordeling.
            </h2>
            <p className="text-body text-muted-foreground">
              Vul het formulier verder in. Een dossierbeheerder zal je aanvraag manueel
              opvolgen en je via berichten op de hoogte houden.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link
                  href={`/aanvragen/nieuw/sociale-toelage/${FILE_TYPE_CODE.VERMOEDE_VAN_TEKORT}`}
                >
                  Formulier starten
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href={routes.newSocialAllowance}>Vorige stap</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageShell>
    </>
  );
}

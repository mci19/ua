import Link from "next/link";
import { Topbar, SignOutButton } from "@/components/common/Topbar";
import { PageShell } from "@/components/common/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function UnknownUserPage() {
  return (
    <>
      <Topbar title="Account niet gevonden" rightSlot={<SignOutButton />} />
      <PageShell>
        <Card className="mx-auto max-w-2xl">
          <CardContent className="space-y-6 p-8">
            <h1 className="text-title text-ua-navy">
              Welkom! We kunnen je account nog niet vinden.
            </h1>
            <p className="text-body text-muted-foreground">
              Om aan de slag te gaan, moeten we eerst je studentengegevens ophalen uit
              ons systeem. Klik op de knop hieronder en geef hiervoor eenmalig
              toestemming. Daarna kun je direct aanvragen indienen.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link
                  href="https://www.uantwerpen.be/sisa"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Navigeer naar SISA
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/">Terug</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageShell>
    </>
  );
}

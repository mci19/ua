import Link from "next/link";
import { Topbar, SignOutButton } from "@/components/common/Topbar";
import { PageShell } from "@/components/common/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Stack } from "@/components/ui/stack";
import { Text } from "@/components/ui/text";

export const dynamic = "force-dynamic";

export default function UnknownUserPage() {
  return (
    <>
      <Topbar title="Account niet gevonden" rightSlot={<SignOutButton />} />
      <PageShell>
        <Card className="mx-auto max-w-2xl">
          <CardContent className="p-8">
            <Stack gap="lg">
              <Heading level="title">
                Welkom! We kunnen je account nog niet vinden.
              </Heading>
              <Text tone="muted">
                Om aan de slag te gaan moeten we eerst je studentengegevens ophalen uit
                ons systeem. Klik op de knop hieronder en geef hiervoor eenmalig
                toestemming. Daarna kun je direct aanvragen indienen.
              </Text>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild intent="subtle" size="lg">
                  <Link href="/">Terug</Link>
                </Button>
                <Button asChild intent="primary" size="lg">
                  <Link
                    href="https://www.uantwerpen.be/sisa"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Navigeer naar SISA
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

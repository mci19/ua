import Link from "next/link";
import { Plus, FolderOpen } from "lucide-react";
import { Topbar, SignOutButton } from "@/components/common/Topbar";
import { PageShell } from "@/components/common/PageShell";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/constants/routes";
import { requireStudent } from "@/lib/server/me";
import { listMyRequests } from "@/lib/dataverse/queries";

export default async function OverviewPage() {
  const { auth, student } = await requireStudent();
  const requests = await listMyRequests(auth, student.contactid).catch(() => []);
  const greeting = student.firstname ?? student.fullname ?? "student";
  const sisaPath = student.ua_sisarequestgranted ? routes.newRequest : routes.sisaGrant;

  return (
    <>
      <Topbar title="Welkom" rightSlot={<SignOutButton />} />
      <PageShell>
        <div className="space-y-2">
          <p className="text-small uppercase tracking-wide text-muted-foreground">
            Universiteit Antwerpen
          </p>
          <h1 className="text-title text-ua-navy">Hallo {greeting},</h1>
          <p className="max-w-prose text-body text-muted-foreground">
            Beheer je aanvragen voor financiële ondersteuning bij de Universiteit
            Antwerpen. Start een nieuwe aanvraag of bekijk de status van je lopende
            dossiers.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Card className="transition hover:border-ua-navy">
            <CardContent className="flex h-full flex-col gap-4 p-6">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ua-navy text-white">
                <Plus className="h-6 w-6" aria-hidden="true" />
              </span>
              <div className="flex-1 space-y-2">
                <CardTitle>Aanvraag starten</CardTitle>
                <CardDescription>
                  Vraag een sociale toelage, voorschot of volmacht aan.
                </CardDescription>
              </div>
              <Button asChild size="lg" className="w-full">
                <Link href={sisaPath}>Aanvraag starten</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="transition hover:border-ua-navy">
            <CardContent className="flex h-full flex-col gap-4 p-6">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ua-red text-white">
                <FolderOpen className="h-6 w-6" aria-hidden="true" />
              </span>
              <div className="flex-1 space-y-2">
                <CardTitle>Mijn aanvragen</CardTitle>
                <CardDescription>
                  {requests.length === 0
                    ? "Je hebt nog geen aanvragen ingediend."
                    : `Je hebt ${requests.length} aanvra${requests.length === 1 ? "ag" : "gen"}.`}
                </CardDescription>
              </div>
              <Button asChild variant="secondary" size="lg" className="w-full">
                <Link href={routes.myRequests}>Mijn aanvragen bekijken</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    </>
  );
}

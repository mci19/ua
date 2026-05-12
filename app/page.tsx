import { Plus, FolderOpen } from "lucide-react";
import { Topbar, SignOutButton } from "@/components/common/Topbar";
import { PageShell } from "@/components/common/PageShell";
import { ActionCard } from "@/components/ui/action-card";
import { PageHeader } from "@/components/ui/page-header";
import { Stack } from "@/components/ui/stack";
import { routes } from "@/lib/constants/routes";
import { requireStudent } from "@/lib/server/me";
import { listMyRequests } from "@/lib/dataverse/queries";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const { auth, student } = await requireStudent();
  const requests = await listMyRequests(auth, student.contactid);
  const greeting = student.firstname ?? student.fullname ?? "student";
  const sisaPath = student.ua_sisarequestgranted ? routes.newRequest : routes.sisaGrant;
  const requestCountLabel =
    requests.length === 0
      ? "Je hebt nog geen aanvragen ingediend."
      : `Je hebt ${requests.length} aanvra${requests.length === 1 ? "ag" : "gen"}.`;

  return (
    <>
      <Topbar title="Welkom" rightSlot={<SignOutButton />} />
      <PageShell>
        <Stack gap="lg">
          <PageHeader
            eyebrow="Universiteit Antwerpen"
            title={`Hallo ${greeting},`}
            description="Beheer je aanvragen voor financiële ondersteuning. Start een nieuwe aanvraag of bekijk de status van je lopende dossiers."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <ActionCard
              href={sisaPath}
              icon={Plus}
              iconTone="navy"
              title="Aanvraag starten"
              description="Vraag een sociale toelage, voorschot of volmacht aan."
            />
            <ActionCard
              href={routes.myRequests}
              icon={FolderOpen}
              iconTone="red"
              title="Mijn aanvragen"
              description={requestCountLabel}
            />
          </div>
        </Stack>
      </PageShell>
    </>
  );
}

import Link from "next/link";
import { FolderOpen, Plus } from "lucide-react";
import { Topbar } from "@/components/common/Topbar";
import { SignOutForm } from "@/components/common/SignOutForm";
import { PageShell } from "@/components/common/PageShell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/ui/page-header";
import { Stack } from "@/components/ui/stack";
import { routes } from "@/lib/constants/routes";
import { listMyRequests } from "@/lib/dataverse/queries";
import { requireStudent } from "@/lib/server/me";
import { RequestsList } from "./RequestsList";
import { RefreshButton } from "./RefreshButton";

export const dynamic = "force-dynamic";

export default async function MyRequestsPage() {
  const { auth, student } = await requireStudent();
  const rows = await listMyRequests(auth, student.contactid);
  return (
    <>
      <Topbar title="Mijn aanvragen" showBack backHref="/" rightSlot={<SignOutForm />} />
      <PageShell>
        <Stack gap="lg">
          <PageHeader
            eyebrow="Overzicht"
            title="Mijn aanvragen"
            description="Hier vind je een overzicht van al je dossiers."
            actions={
              <>
                <RefreshButton />
                <Button asChild>
                  <Link href={routes.newRequest}>
                    <Plus className="h-4 w-4" aria-hidden="true" /> Nieuwe aanvraag
                  </Link>
                </Button>
              </>
            }
          />
          {rows.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="Nog geen aanvragen"
              description="Start een nieuwe aanvraag om hier overzicht te krijgen."
              action={
                <Button asChild>
                  <Link href={routes.newRequest}>Aanvraag starten</Link>
                </Button>
              }
            />
          ) : (
            <RequestsList rows={rows} />
          )}
        </Stack>
      </PageShell>
    </>
  );
}

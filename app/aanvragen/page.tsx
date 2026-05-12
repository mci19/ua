import Link from "next/link";
import { FolderOpen, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
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
  const t = await getTranslations("myRequests");
  const { auth, student } = await requireStudent();
  const rows = await listMyRequests(auth, student.contactid);
  return (
    <>
      <Topbar title={t("topbarTitle")} showBack backHref="/" rightSlot={<SignOutForm />} />
      <PageShell>
        <Stack gap="lg">
          <PageHeader
            eyebrow={t("eyebrow")}
            title={t("title")}
            description={t("description")}
            actions={
              <>
                <RefreshButton />
                <Button asChild>
                  <Link href={routes.newRequest}>
                    <Plus className="h-4 w-4" aria-hidden="true" /> {t("newRequest")}
                  </Link>
                </Button>
              </>
            }
          />
          {rows.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title={t("emptyTitle")}
              description={t("emptyDescription")}
              action={
                <Button asChild>
                  <Link href={routes.newRequest}>{t("emptyAction")}</Link>
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

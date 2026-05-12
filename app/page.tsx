import { Plus, FolderOpen } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Topbar } from "@/components/common/Topbar";
import { SignOutForm } from "@/components/common/SignOutForm";
import { PageShell } from "@/components/common/PageShell";
import { ActionCard } from "@/components/ui/action-card";
import { PageHeader } from "@/components/ui/page-header";
import { Stack } from "@/components/ui/stack";
import { routes } from "@/lib/constants/routes";
import { requireStudent } from "@/lib/server/me";
import { listMyRequests } from "@/lib/dataverse/queries";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const t = await getTranslations("overview");
  const { auth, student } = await requireStudent();
  const requests = await listMyRequests(auth, student.contactid);
  const greeting = student.firstname ?? student.fullname ?? "student";
  const sisaPath = student.ua_sisarequestgranted ? routes.newRequest : routes.sisaGrant;

  return (
    <>
      <Topbar title={t("topbarTitle")} rightSlot={<SignOutForm />} />
      <PageShell>
        <Stack gap="lg">
          <PageHeader
            eyebrow={t("eyebrow")}
            title={t("greeting", { name: greeting })}
            description={t("intro")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <ActionCard
              href={sisaPath}
              icon={Plus}
              intent="primary"
              title={t("startTitle")}
              description={t("startDesc")}
            />
            <ActionCard
              href={routes.myRequests}
              icon={FolderOpen}
              intent="secondary"
              title={t("myRequestsTitle")}
              description={t("myRequestsCount", { count: requests.length })}
            />
          </div>
        </Stack>
      </PageShell>
    </>
  );
}

import { PageShell } from "@/components/common/PageShell";
import { ProgressTimeline } from "@/components/common/ProgressTimeline";
import { Topbar, SignOutButton } from "@/components/common/Topbar";
import { wizardSteps } from "@/components/wizard/steps";
import { routes } from "@/lib/constants/routes";
import { getRequest } from "@/lib/dataverse/queries";
import { requireStudent } from "@/lib/server/me";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const PATH_TO_STEP: Record<string, string> = {
  formulier: "formulier",
  documenten: "documenten",
  berichten: "berichten",
  voorschot: "documenten",
  ingediend: "berichten",
};

export default async function WizardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { auth, student } = await requireStudent();
  const request = await getRequest(auth, id).catch(() => null);
  if (!request) notFound();
  if (request._ua_student_value !== student.contactid) redirect(routes.myRequests);

  const path = (await headers()).get("x-invoke-path") ?? "";
  const last = path.split("/").pop() ?? "formulier";
  const activeStep = PATH_TO_STEP[last] ?? "formulier";

  return (
    <>
      <Topbar
        title={request.ua_filenumber ?? "Aanvraag"}
        showBack
        backHref={routes.myRequests}
        rightSlot={<SignOutButton />}
      />
      <PageShell
        aside={
          <div className="space-y-4">
            <div>
              <p className="text-small uppercase tracking-wide text-muted-foreground">
                Dossier
              </p>
              <p className="text-label font-semibold text-ua-navy">
                {request.ua_filetypeid?.ua_name ?? "—"}
              </p>
            </div>
            <ProgressTimeline steps={wizardSteps} activeStepId={activeStep} />
          </div>
        }
      >
        {children}
      </PageShell>
    </>
  );
}

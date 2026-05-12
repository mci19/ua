import { PageShell } from "@/components/common/PageShell";
import { ProgressTimeline, withSubtitle } from "@/components/common/ProgressTimeline";
import { Topbar } from "@/components/common/Topbar";
import { SignOutForm } from "@/components/common/SignOutForm";
import { wizardSteps } from "@/components/wizard/steps";
import { routes } from "@/lib/constants/routes";
import { getRequest } from "@/lib/dataverse/queries";
import { requireStudent } from "@/lib/server/me";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
  // If the request is gone (cookie expired, redeploy lost it, or wrong
  // bookmark) we bounce back to /aanvragen rather than showing a hard 404
  // — the dossier list is the right starting point.
  if (!request) redirect(routes.myRequests);
  if (request._ua_studentid_value !== student.contactid) redirect(routes.myRequests);

  const path = (await headers()).get("x-invoke-path") ?? "";
  const last = path.split("/").pop() ?? "formulier";
  const activeStep = PATH_TO_STEP[last] ?? "formulier";
  const stepsWithSubtitle = withSubtitle(
    wizardSteps,
    "formulier",
    request.ua_filenumber ? `Dossiernummer: ${request.ua_filenumber}` : null,
  );

  return (
    <>
      <Topbar
        title={request.ua_filenumber ?? "Aanvraag"}
        showBack
        backHref={routes.myRequests}
        rightSlot={<SignOutForm />}
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
            <ProgressTimeline steps={stepsWithSubtitle} activeStepId={activeStep} />
          </div>
        }
      >
        {children}
      </PageShell>
    </>
  );
}

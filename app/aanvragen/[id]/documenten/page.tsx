import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DocumentChecklist } from "@/components/documents/DocumentChecklist";
import { SubmitRequestButton } from "@/components/wizard/SubmitRequestButton";
import { PageHeader } from "@/components/ui/page-header";
import { Stack } from "@/components/ui/stack";
import { WizardActions } from "@/components/ui/wizard-actions";
import { requireAuthContext } from "@/lib/auth/session";
import {
  getRequest,
  listDocumentsForRequest,
  listRequiredDocuments,
} from "@/lib/dataverse/queries";
import { isEditable } from "@/lib/constants/statuses";
import { routes } from "@/lib/constants/routes";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auth = await requireAuthContext();
  const request = await getRequest(auth, id);
  const [required, existing] = await Promise.all([
    request._ua_filetypeid_value
      ? listRequiredDocuments(auth, request._ua_filetypeid_value)
      : Promise.resolve([]),
    listDocumentsForRequest(auth, id),
  ]);
  const editable = isEditable(request.statuscode);

  return (
    <Stack gap="lg">
      <PageHeader
        eyebrow="Stap 3 van 4 · Documenten"
        title="Laad de nodige documenten op"
        description="Een rood sterretje geeft een verplicht document aan. Vink &ldquo;Niet van toepassing&rdquo; aan als een document niet relevant is voor jouw situatie."
      />
      <Card>
        <CardContent className="p-0">
          <DocumentChecklist
            requestId={id}
            requiredDocuments={required}
            existing={existing}
            readOnly={!editable}
          />
        </CardContent>
      </Card>
      <WizardActions>
        <Button asChild intent="subtle">
          <Link href={routes.requestForm(id)}>Vorige stap</Link>
        </Button>
        {editable ? (
          <SubmitRequestButton requestId={id} />
        ) : (
          <Button asChild intent="primary">
            <Link href={routes.requestMessages(id)}>Naar berichten</Link>
          </Button>
        )}
      </WizardActions>
    </Stack>
  );
}

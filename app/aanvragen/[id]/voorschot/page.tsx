import Link from "next/link";
import { Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { PageHeader } from "@/components/ui/page-header";
import { Stack } from "@/components/ui/stack";
import { Text } from "@/components/ui/text";
import { WizardActions } from "@/components/ui/wizard-actions";
import { VoorschotUpload } from "@/components/documents/VoorschotUpload";
import { SubmitRequestButton } from "@/components/wizard/SubmitRequestButton";
import { requireAuthContext } from "@/lib/auth/session";
import { getRequest, listDocumentsForRequest } from "@/lib/dataverse/queries";
import { isEditable } from "@/lib/constants/statuses";
import { routes } from "@/lib/constants/routes";
import { FILE_TYPE_CODE } from "@/lib/constants/dossierTypes";

export const dynamic = "force-dynamic";

export default async function VoorschotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auth = await requireAuthContext();
  const [request, existing] = await Promise.all([
    getRequest(auth, id),
    listDocumentsForRequest(auth, id),
  ]);
  const code = request.ua_filetypeid?.ua_id;
  const filetypeRef = request._ua_filetypeid_value ?? code ?? "";
  const isPoA = code === FILE_TYPE_CODE.VERLENEN_VAN_VOLMACHT;
  const editable = isEditable(request.statuscode);
  const docLabel = isPoA ? "volmacht" : "overeenkomst";

  return (
    <Stack gap="lg">
      <PageHeader
        eyebrow="Stap 3 van 4 · Document"
        title={isPoA ? "Volmachtsdocument" : "Voorschotsovereenkomst"}
        description={`Download ${
          isPoA ? "het volmachtsformulier" : "de overeenkomst"
        }, laat het ondertekenen en laad daarna de ondertekende versie op.`}
      />
      <Card>
        <CardContent className="p-6">
          <Stack gap="lg">
            <Stack gap="sm">
              <Heading level="subheader">Stap 1 — Download {docLabel}</Heading>
              <Text size="small" tone="muted">
                Open het PDF-document, vul het in en onderteken het.
              </Text>
              <Button asChild intent="primary" className="self-start">
                <Link
                  href={`/api/dossier-types/${encodeURIComponent(filetypeRef)}/template`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download {docLabel}
                </Link>
              </Button>
            </Stack>
            <Stack gap="sm" className="border-t border-ua-gray-light pt-6">
              <Heading level="subheader">Stap 2 — Laad het ondertekende document op</Heading>
              <VoorschotUpload requestId={id} existing={existing} readOnly={!editable} />
            </Stack>
          </Stack>
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

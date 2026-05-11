import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
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
    listDocumentsForRequest(auth, id).catch(() => []),
  ]);
  const code = request.ua_filetypeid?.ua_id;
  const filetypeRef = request._ua_filetypeid_value ?? code ?? "";
  const isPoA = code === FILE_TYPE_CODE.VERLENEN_VAN_VOLMACHT;
  const editable = isEditable(request.statuscode);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-small uppercase tracking-wide text-muted-foreground">
          Stap 3 van 4 · Document
        </p>
        <h2 className="text-title text-ua-navy">
          {isPoA ? "Volmachtsdocument" : "Voorschotsovereenkomst"}
        </h2>
        <p className="text-body text-muted-foreground">
          Download {isPoA ? "het volmachtsformulier" : "de overeenkomst"}, laat het
          ondertekenen en laad daarna de ondertekende versie op.
        </p>
      </div>
      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-label font-semibold text-ua-navy">
                Stap 1 — Download {isPoA ? "volmacht" : "overeenkomst"}
              </p>
              <p className="text-small text-muted-foreground">
                Open het PDF-document, vul het in en onderteken het.
              </p>
            </div>
            <Button asChild variant="secondary">
              <Link
                href={`/api/dossier-types/${encodeURIComponent(filetypeRef)}/template`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download {isPoA ? "volmacht" : "overeenkomst"}
              </Link>
            </Button>
          </div>
          <div className="space-y-2 border-t border-ua-gray-light pt-6">
            <p className="text-label font-semibold text-ua-navy">
              Stap 2 — Laad het ondertekende document op
            </p>
            <VoorschotUpload requestId={id} existing={existing} readOnly={!editable} />
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-col items-stretch justify-end gap-3 sm:flex-row">
        <Button asChild variant="secondary">
          <Link href={routes.requestForm(id)}>Vorige stap</Link>
        </Button>
        {editable ? (
          <SubmitRequestButton requestId={id} />
        ) : (
          <Button asChild>
            <Link href={routes.requestMessages(id)}>Naar berichten</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

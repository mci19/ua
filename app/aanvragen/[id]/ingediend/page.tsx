import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireAuthContext } from "@/lib/auth/session";
import { getRequest } from "@/lib/dataverse/queries";
import { routes } from "@/lib/constants/routes";

export const dynamic = "force-dynamic";

export default async function SubmittedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auth = await requireAuthContext();
  const request = await getRequest(auth, id);
  return (
    <Card className="mx-auto max-w-2xl">
      <CardContent className="flex flex-col items-center gap-6 p-10 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
        </span>
        <div className="space-y-2">
          <h2 className="text-title text-ua-navy">Je aanvraag werd ingediend</h2>
          <p className="text-body text-muted-foreground">
            Dossiernummer <strong>{request.ua_filenumber ?? id.slice(0, 8)}</strong>. We
            laten je via berichten weten zodra een dossierbehandelaar je aanvraag
            oppakt.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href={routes.requestMessages(id)}>Bekijk berichten</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={routes.overview}>Terug naar startpagina</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

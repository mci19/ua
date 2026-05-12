import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Stack } from "@/components/ui/stack";
import { Text } from "@/components/ui/text";
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
      <CardContent className="p-10">
        <Stack align="center" gap="lg" className="text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
          </span>
          <Stack gap="xs" align="center">
            <Heading level="title">Je aanvraag werd ingediend</Heading>
            <Text tone="muted">
              Dossiernummer{" "}
              <strong className="text-foreground">
                {request.ua_filenumber ?? id.slice(0, 8)}
              </strong>
              . We laten je via berichten weten zodra een dossierbehandelaar je aanvraag oppakt.
            </Text>
          </Stack>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild intent="subtle">
              <Link href={routes.overview}>Terug naar startpagina</Link>
            </Button>
            <Button asChild intent="primary">
              <Link href={routes.requestMessages(id)}>Bekijk berichten</Link>
            </Button>
          </div>
        </Stack>
      </CardContent>
    </Card>
  );
}

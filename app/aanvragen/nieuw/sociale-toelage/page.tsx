import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Topbar, SignOutButton } from "@/components/common/Topbar";
import { PageShell } from "@/components/common/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Stack } from "@/components/ui/stack";
import { Text } from "@/components/ui/text";
import {
  FILE_TYPE_CODE,
  FILE_TYPE_LABEL_NL,
} from "@/lib/constants/dossierTypes";
import { routes } from "@/lib/constants/routes";

const scenarios = [
  {
    code: FILE_TYPE_CODE.STUDIETOELAGE_TOEGEKEND,
    href: `/aanvragen/nieuw/sociale-toelage/${FILE_TYPE_CODE.STUDIETOELAGE_TOEGEKEND}`,
  },
  {
    code: FILE_TYPE_CODE.LEEFLOON,
    href: `/aanvragen/nieuw/sociale-toelage/${FILE_TYPE_CODE.LEEFLOON}`,
  },
  {
    code: FILE_TYPE_CODE.VERMOEDE_VAN_TEKORT,
    href: routes.newSocialAllowanceOther,
  },
] as const;

export default function SocialAllowancePickerPage() {
  return (
    <>
      <Topbar
        title="Aanvraag sociale toelage"
        showBack
        backHref={routes.newRequest}
        rightSlot={<SignOutButton />}
      />
      <PageShell>
        <Stack gap="lg">
          <PageHeader
            eyebrow="Stap 1 van 4"
            title="Aanvraag sociale toelage"
            description="Welke situatie omschrijft jouw aanvraag het best?"
          />
          <Stack as="ul" gap="sm">
            {scenarios.map(({ code, href }) => (
              <li key={code}>
                <Card className="transition hover:border-ua-navy">
                  <Link
                    href={href}
                    className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ua-navy focus-visible:ring-offset-2 rounded-lg"
                  >
                    <CardContent className="flex items-center justify-between gap-4 p-5">
                      <Text size="label">{FILE_TYPE_LABEL_NL[code]}</Text>
                      <ChevronRight className="h-5 w-5 text-ua-navy" aria-hidden="true" />
                    </CardContent>
                  </Link>
                </Card>
              </li>
            ))}
          </Stack>
          <Button asChild intent="subtle" size="md" className="self-start">
            <Link href={routes.newRequest}>Annuleren</Link>
          </Button>
        </Stack>
      </PageShell>
    </>
  );
}

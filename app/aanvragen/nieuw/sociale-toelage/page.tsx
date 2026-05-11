import Link from "next/link";
import { Topbar, SignOutButton } from "@/components/common/Topbar";
import { PageShell } from "@/components/common/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
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
        <p className="mb-6 max-w-prose text-body text-muted-foreground">
          Welke situatie omschrijft jouw aanvraag het best?
        </p>
        <ul className="space-y-3">
          {scenarios.map(({ code, href }) => (
            <li key={code}>
              <Card className="transition hover:border-ua-navy">
                <Link href={href} className="block focus:outline-none">
                  <CardContent className="flex items-center justify-between gap-4 p-5">
                    <span className="text-label text-foreground">
                      {FILE_TYPE_LABEL_NL[code]}
                    </span>
                    <ChevronRight className="h-5 w-5 text-ua-navy" aria-hidden="true" />
                  </CardContent>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <Button asChild variant="secondary">
            <Link href={routes.newRequest}>Annuleren</Link>
          </Button>
        </div>
      </PageShell>
    </>
  );
}

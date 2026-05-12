import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-xl">
        <CardContent className="space-y-4 p-8 text-center">
          <h1 className="text-title text-ua-navy">{t("title")}</h1>
          <p className="text-body text-muted-foreground">{t("description")}</p>
          <Button asChild>
            <Link href="/">{t("homeButton")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

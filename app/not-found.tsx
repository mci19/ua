import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-xl">
        <CardContent className="space-y-4 p-8 text-center">
          <h1 className="text-title text-ua-navy">Pagina niet gevonden</h1>
          <p className="text-body text-muted-foreground">
            De pagina die je zocht bestaat niet of werd verplaatst.
          </p>
          <Button asChild>
            <Link href="/">Naar de startpagina</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

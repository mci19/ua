import { LogOut } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/auth";

// Server Component on purpose: it uses the NextAuth `signOut()` server
// action, which manages the CSRF token internally. Hitting POST
// /api/auth/signout from a plain <form> fails with MissingCSRF.
export async function SignOutForm() {
  const t = await getTranslations("auth");
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <Button type="submit" intent="onDark" size="sm" aria-label={t("signOut")}>
        <LogOut className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">{t("signOut")}</span>
      </Button>
    </form>
  );
}

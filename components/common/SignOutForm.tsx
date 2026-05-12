import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/auth";

// Server Component on purpose: it uses the NextAuth `signOut()` server
// action, which manages the CSRF token internally. Hitting POST
// /api/auth/signout from a plain <form> fails with MissingCSRF.
export function SignOutForm() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <Button type="submit" intent="onDark" size="sm" aria-label="Afmelden">
        <LogOut className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Afmelden</span>
      </Button>
    </form>
  );
}

"use client";

import { RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      <RefreshCcw
        className={pending ? "h-4 w-4 animate-spin" : "h-4 w-4"}
        aria-hidden="true"
      />
      <span className="hidden sm:inline">Vernieuwen</span>
    </Button>
  );
}

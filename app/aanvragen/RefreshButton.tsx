"use client";

import { RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      intent="subtle"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      <RefreshCcw
        className={cn("h-4 w-4", pending && "animate-spin")}
        aria-hidden="true"
      />
      Vernieuwen
    </Button>
  );
}

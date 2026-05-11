"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/fetcher";

interface SisaGrantFormProps {
  returnTo: string;
}

export function SisaGrantForm({ returnTo }: SisaGrantFormProps) {
  const router = useRouter();
  const grant = useMutation({
    mutationFn: () => apiFetch<{ grantedOn: string }>("/api/me/sisa-grant", { method: "POST" }),
    onSuccess: () => {
      toast.success("Toestemming opgeslagen.");
      router.push(returnTo);
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button onClick={() => grant.mutate()} disabled={grant.isPending} size="lg">
        {grant.isPending ? "Bezig…" : "Toestemming verlenen"}
      </Button>
      <Button asChild variant="secondary" size="lg">
        <Link href="/">Annuleren</Link>
      </Button>
    </div>
  );
}

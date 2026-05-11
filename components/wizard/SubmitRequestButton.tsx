"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/fetcher";
import { routes } from "@/lib/constants/routes";

export function SubmitRequestButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const submit = useMutation({
    mutationFn: () => apiFetch(`/api/requests/${requestId}/submit`, { method: "POST" }),
    onSuccess: () => {
      router.push(routes.requestSubmitted(requestId));
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });
  return (
    <Button onClick={() => submit.mutate()} disabled={submit.isPending} size="lg">
      {submit.isPending ? "Bezig…" : "Aanvraag indienen"}
    </Button>
  );
}

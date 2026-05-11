"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/FormField";
import { powerOfAttorneySchema, type CreateRequestInput } from "@/lib/schemas/request";
import { DOSSIER_TYPE_ID } from "@/lib/constants/dossierTypes";
import { apiFetch, type ClientApiError } from "@/lib/api/fetcher";
import { routes } from "@/lib/constants/routes";

type FormValues = Extract<
  CreateRequestInput,
  { fileTypeCode: typeof DOSSIER_TYPE_ID.VERLENEN_VAN_VOLMACHT }
>;

export function PowerOfAttorneyForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(powerOfAttorneySchema),
    defaultValues: {
      fileTypeCode: DOSSIER_TYPE_ID.VERLENEN_VAN_VOLMACHT,
      motivation: "",
    },
  });

  const create = useMutation({
    mutationFn: (values: FormValues) =>
      apiFetch<{ ua_requestid: string }>("/api/requests", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: (data) => router.push(routes.requestVoorschot(data.ua_requestid)),
    onError: (err: ClientApiError) => {
      if (err.status === 409) {
        toast.warning("Je hebt al een open volmachtaanvraag.");
        router.push(routes.myRequests);
        return;
      }
      toast.error(err.message);
    },
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit((v) => create.mutate(v))}
      className="space-y-5"
    >
      <input type="hidden" {...register("fileTypeCode")} />
      <FormField
        label="Korte toelichting (optioneel)"
        htmlFor="motivation"
        error={errors.motivation?.message}
        hint="Beschrijf voor wie je de volmacht aanvraagt."
      >
        <Textarea id="motivation" rows={4} {...register("motivation")} />
      </FormField>
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button asChild type="button" variant="secondary">
          <Link href={routes.newRequest}>Annuleren</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting || create.isPending}>
          {create.isPending ? "Bezig…" : "Opslaan en doorgaan"}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Stack } from "@/components/ui/stack";
import { WizardActions } from "@/components/ui/wizard-actions";
import { FormField, FormGrid } from "@/components/forms/FormField";
import { createRequestSchema, type CreateRequestInput } from "@/lib/schemas/request";
import { FILE_TYPE_CODE } from "@/lib/constants/dossierTypes";
import { apiFetch, type ClientApiError } from "@/lib/api/fetcher";
import { currentAcademicYear } from "@/lib/utils/date";
import { routes } from "@/lib/constants/routes";

type FormValues = Extract<
  CreateRequestInput,
  { fileTypeCode: typeof FILE_TYPE_CODE.VOORSCHOT_STUDIETOELAGE }
>;

export function AdvanceForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      fileTypeCode: FILE_TYPE_CODE.VOORSCHOT_STUDIETOELAGE,
      referenceYear: currentAcademicYear(),
      iban: "",
      bic: "",
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
        toast.warning("Je hebt al een open voorschot-aanvraag.");
        router.push(routes.myRequests);
        return;
      }
      toast.error(err.message);
    },
  });

  return (
    <form noValidate onSubmit={handleSubmit((v) => create.mutate(v))}>
      <Stack gap="md" as="div">
        <input type="hidden" {...register("fileTypeCode")} />
        <FormField
          label="Academiejaar"
          htmlFor="referenceYear"
          required
          error={errors.referenceYear?.message}
        >
          <Input id="referenceYear" {...register("referenceYear")} />
        </FormField>
        <FormGrid>
          <FormField
            label="IBAN (rekeningnummer)"
            htmlFor="iban"
            required
            error={errors.iban?.message}
          >
            <Input id="iban" placeholder="BE00 0000 0000 0000" {...register("iban")} />
          </FormField>
          <FormField label="BIC" htmlFor="bic" error={errors.bic?.message} hint="Optioneel">
            <Input id="bic" placeholder="GEBABEBB" {...register("bic")} />
          </FormField>
        </FormGrid>
        <FormField label="Korte toelichting (optioneel)" htmlFor="motivation">
          <Textarea id="motivation" rows={4} {...register("motivation")} />
        </FormField>
        <WizardActions>
          <Button asChild type="button" intent="subtle">
            <Link href={routes.newRequest}>Annuleren</Link>
          </Button>
          <Button type="submit" intent="primary" disabled={isSubmitting || create.isPending}>
            {create.isPending ? "Bezig…" : "Opslaan en doorgaan"}
          </Button>
        </WizardActions>
      </Stack>
    </form>
  );
}

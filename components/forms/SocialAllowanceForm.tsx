"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/FormField";
import { createRequestSchema, type CreateRequestInput } from "@/lib/schemas/request";
import { apiFetch, type ClientApiError } from "@/lib/api/fetcher";
import { type FileTypeCode } from "@/lib/constants/dossierTypes";
import { currentAcademicYear } from "@/lib/utils/date";
import { routes } from "@/lib/constants/routes";

type FormValues = Extract<CreateRequestInput, { fileTypeCode: FileTypeCode; iban: string }>;

export function SocialAllowanceForm({ scenarioCode }: { scenarioCode: FileTypeCode }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      fileTypeCode: scenarioCode as FormValues["fileTypeCode"],
      referenceYear: currentAcademicYear(),
      isAlleenstaand: false,
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
    onSuccess: (data) => {
      router.push(routes.requestDocuments(data.ua_requestid));
      router.refresh();
    },
    onError: (err: ClientApiError) => {
      if (err.status === 409) {
        toast.warning("Je hebt al een open aanvraag van dit type.");
        router.push(routes.myRequests);
        return;
      }
      toast.error(err.message);
    },
  });

  const isAlleenstaand = watch("isAlleenstaand");

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => create.mutate(values))}
      className="space-y-5"
    >
      <input type="hidden" {...register("fileTypeCode")} />
      <FormField
        label="Academiejaar"
        htmlFor="referenceYear"
        required
        error={errors.referenceYear?.message}
        hint="Bv. 2025-2026"
      >
        <Input id="referenceYear" {...register("referenceYear")} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <FormField
          label="IBAN (rekeningnummer)"
          htmlFor="iban"
          required
          error={errors.iban?.message}
          hint="Belgisch IBAN beginnend met BE"
        >
          <Input id="iban" placeholder="BE00 0000 0000 0000" {...register("iban")} />
        </FormField>
        <FormField label="BIC" htmlFor="bic" error={errors.bic?.message} hint="Optioneel">
          <Input id="bic" placeholder="GEBABEBB" {...register("bic")} />
        </FormField>
      </div>
      <FormField label="Burgerlijke staat" htmlFor="isAlleenstaand">
        <label className="flex items-start gap-3">
          <Checkbox
            id="isAlleenstaand"
            checked={!!isAlleenstaand}
            onCheckedChange={(v) => setValue("isAlleenstaand", v === true)}
          />
          <span className="text-label">Ik ben alleenstaand.</span>
        </label>
      </FormField>
      <FormField
        label="Motivatie"
        htmlFor="motivation"
        required
        error={errors.motivation?.message}
        hint="Beschrijf je situatie in minstens 50 tekens."
      >
        <Textarea id="motivation" rows={6} {...register("motivation")} />
      </FormField>
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button asChild type="button" variant="secondary">
          <Link href={routes.newSocialAllowance}>Annuleren</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting || create.isPending}>
          {create.isPending ? "Bezig…" : "Opslaan en doorgaan"}
        </Button>
      </div>
    </form>
  );
}

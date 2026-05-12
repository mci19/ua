"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Stack } from "@/components/ui/stack";
import { Text } from "@/components/ui/text";
import { WizardActions } from "@/components/ui/wizard-actions";
import { FormField, FormGrid } from "@/components/forms/FormField";
import {
  socialAllowanceSchema,
  type SocialAllowanceInput,
} from "@/lib/schemas/request";
import { apiFetch, type ClientApiError } from "@/lib/api/fetcher";
import { type FileTypeCode } from "@/lib/constants/dossierTypes";
import { currentAcademicYear } from "@/lib/utils/date";
import { routes } from "@/lib/constants/routes";

export function SocialAllowanceForm({ scenarioCode }: { scenarioCode: FileTypeCode }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SocialAllowanceInput>({
    resolver: zodResolver(socialAllowanceSchema),
    defaultValues: {
      fileTypeCode: scenarioCode as SocialAllowanceInput["fileTypeCode"],
      referenceYear: currentAcademicYear(),
      isAlleenstaand: false,
      iban: "",
      bic: "",
      motivation: "",
    },
  });

  const create = useMutation({
    mutationFn: (values: SocialAllowanceInput) =>
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
    <form noValidate onSubmit={handleSubmit((values) => create.mutate(values))}>
      <Stack gap="md" as="div">
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
        <FormGrid>
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
        </FormGrid>
        <FormField label="Burgerlijke staat" htmlFor="isAlleenstaand">
          <label className="flex items-start gap-3">
            <Checkbox
              id="isAlleenstaand"
              checked={!!isAlleenstaand}
              onCheckedChange={(v) => setValue("isAlleenstaand", v === true)}
            />
            <Text size="label">Ik ben alleenstaand.</Text>
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
        <WizardActions>
          <Button asChild type="button" intent="subtle">
            <Link href={routes.newSocialAllowance}>Annuleren</Link>
          </Button>
          <Button type="submit" intent="primary" disabled={isSubmitting || create.isPending}>
            {create.isPending ? "Bezig…" : "Opslaan en doorgaan"}
          </Button>
        </WizardActions>
      </Stack>
    </form>
  );
}

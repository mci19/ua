"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/FormField";
import { updateRequestSchema, type UpdateRequestInput } from "@/lib/schemas/request";
import { apiFetch } from "@/lib/api/fetcher";
import type { RequestRow } from "@/lib/dataverse/types";
import { routes } from "@/lib/constants/routes";

export function EditRequestForm({
  request,
  readOnly,
}: {
  request: RequestRow;
  readOnly: boolean;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateRequestInput>({
    resolver: zodResolver(updateRequestSchema),
    defaultValues: {
      iban: request.ua_iban ?? "",
      bic: request.ua_bic ?? "",
      motivation: request.ua_motivation ?? undefined,
      isAlleenstaand: !!request.ua_isalleenstaand,
      referenceYear: request.ua_referenceyear ?? undefined,
    },
  });

  const save = useMutation({
    mutationFn: (values: UpdateRequestInput) =>
      apiFetch(`/api/requests/${request.ua_requestid}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success("Wijzigingen opgeslagen.");
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const isAlleenstaand = watch("isAlleenstaand");

  return (
    <form
      noValidate
      onSubmit={handleSubmit((v) => save.mutate(v))}
      className="space-y-5"
    >
      <FormField
        label="Academiejaar"
        htmlFor="referenceYear"
        error={errors.referenceYear?.message}
      >
        <Input id="referenceYear" disabled={readOnly} {...register("referenceYear")} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <FormField label="IBAN" htmlFor="iban" error={errors.iban?.message}>
          <Input id="iban" disabled={readOnly} {...register("iban")} />
        </FormField>
        <FormField
          label="BIC"
          htmlFor="bic"
          error={errors.bic?.message}
          hint="Optioneel"
        >
          <Input id="bic" disabled={readOnly} {...register("bic")} />
        </FormField>
      </div>
      <FormField label="Burgerlijke staat" htmlFor="isAlleenstaand">
        <label className="flex items-start gap-3">
          <Checkbox
            id="isAlleenstaand"
            disabled={readOnly}
            checked={!!isAlleenstaand}
            onCheckedChange={(v) => setValue("isAlleenstaand", v === true, { shouldDirty: true })}
          />
          <span className="text-label">Ik ben alleenstaand.</span>
        </label>
      </FormField>
      <FormField label="Motivatie" htmlFor="motivation" error={errors.motivation?.message}>
        <Textarea
          id="motivation"
          rows={6}
          disabled={readOnly}
          {...register("motivation")}
        />
      </FormField>
      {!readOnly ? (
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="submit"
            disabled={!isDirty || isSubmitting || save.isPending}
          >
            {save.isPending ? "Bezig…" : "Wijzigingen opslaan"}
          </Button>
        </div>
      ) : (
        <p className="text-small text-muted-foreground">
          Deze aanvraag is ingediend en kan niet meer worden aangepast.{" "}
          <a href={routes.requestMessages(request.ua_requestid)} className="ua-link">
            Open de berichten
          </a>{" "}
          om met de dossierbeheerder te communiceren.
        </p>
      )}
    </form>
  );
}

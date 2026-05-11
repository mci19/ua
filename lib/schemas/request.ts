import { z } from "zod";
import { ibanSchema, motivationSchema, referenceYearSchema } from "@/lib/schemas/common";
import { DOSSIER_TYPE_ID, DOSSIER_SUBTYPE_ID } from "@/lib/constants/dossierTypes";

export const socialAllowanceScenarioSchema = z.object({
  fileTypeCode: z.literal(DOSSIER_TYPE_ID.SOCIALE_TOELAGE),
  fileSubtypeCode: z.enum([
    DOSSIER_SUBTYPE_ID.STUDIETOELAGE_TOEGEKEND,
    DOSSIER_SUBTYPE_ID.STUDIETOELAGE_NIET_ONTVANGEN,
    DOSSIER_SUBTYPE_ID.LEEFLOON,
    DOSSIER_SUBTYPE_ID.VERMOEDE_VAN_TEKORT,
  ]),
  iban: ibanSchema,
  isAlleenstaand: z.boolean().default(false),
  motivation: motivationSchema,
  referenceYear: referenceYearSchema,
});

export const advanceSchema = z.object({
  fileTypeCode: z.literal(DOSSIER_TYPE_ID.VOORSCHOT_STUDIETOELAGE),
  iban: ibanSchema,
  motivation: motivationSchema.optional(),
  referenceYear: referenceYearSchema,
});

export const powerOfAttorneySchema = z.object({
  fileTypeCode: z.literal(DOSSIER_TYPE_ID.VERLENEN_VAN_VOLMACHT),
  motivation: motivationSchema.optional(),
});

export const createRequestSchema = z.discriminatedUnion("fileTypeCode", [
  socialAllowanceScenarioSchema,
  advanceSchema,
  powerOfAttorneySchema,
]);

export type CreateRequestInput = z.infer<typeof createRequestSchema>;

export const updateRequestSchema = z.object({
  iban: ibanSchema.optional(),
  bic: z.string().trim().min(8).max(11).optional(),
  motivation: motivationSchema.optional(),
  isAlleenstaand: z.boolean().optional(),
  referenceYear: referenceYearSchema.optional(),
});

export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;

export const commentSchema = z.object({
  text: z.string().trim().min(1, "Schrijf een bericht.").max(2000, "Maximaal 2000 tekens."),
});

export type CommentInput = z.infer<typeof commentSchema>;

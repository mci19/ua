import { z } from "zod";
import { ibanSchema, motivationSchema, referenceYearSchema } from "@/lib/schemas/common";
import { FILE_TYPE_CODE, SOCIAL_ALLOWANCE_SCENARIOS } from "@/lib/constants/dossierTypes";

const bicSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, "Geef een geldige BIC op (8 of 11 tekens).")
  .optional()
  .or(z.literal(""));

// Exported individually so each form component can import only the schema
// it needs — keeps the per-form Zod resolver simple and prevents
// cross-variant validation noise.
export const socialAllowanceSchema = z.object({
  fileTypeCode: z.enum([
    SOCIAL_ALLOWANCE_SCENARIOS[0],
    SOCIAL_ALLOWANCE_SCENARIOS[1],
    SOCIAL_ALLOWANCE_SCENARIOS[2],
    SOCIAL_ALLOWANCE_SCENARIOS[3],
  ]),
  iban: ibanSchema,
  bic: bicSchema,
  isAlleenstaand: z.boolean().default(false),
  motivation: motivationSchema,
  referenceYear: referenceYearSchema,
});

export const advanceSchema = z.object({
  fileTypeCode: z.literal(FILE_TYPE_CODE.VOORSCHOT_STUDIETOELAGE),
  iban: ibanSchema,
  bic: bicSchema,
  motivation: motivationSchema.optional(),
  referenceYear: referenceYearSchema,
});

export const powerOfAttorneySchema = z.object({
  fileTypeCode: z.literal(FILE_TYPE_CODE.VERLENEN_VAN_VOLMACHT),
  motivation: motivationSchema.optional(),
});

// Server-side discriminated union — the API route validates incoming
// payloads against this. Discriminated union (vs plain union) gives clearer
// error messages and faster parsing.
export const createRequestSchema = z.discriminatedUnion("fileTypeCode", [
  socialAllowanceSchema,
  advanceSchema,
  powerOfAttorneySchema,
]);

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type SocialAllowanceInput = z.infer<typeof socialAllowanceSchema>;
export type AdvanceInput = z.infer<typeof advanceSchema>;
export type PowerOfAttorneyInput = z.infer<typeof powerOfAttorneySchema>;

export const updateRequestSchema = z.object({
  iban: ibanSchema.optional(),
  bic: bicSchema,
  motivation: motivationSchema.optional(),
  isAlleenstaand: z.boolean().optional(),
  referenceYear: referenceYearSchema.optional(),
});

export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;

export const commentSchema = z.object({
  text: z.string().trim().min(1, "Schrijf een bericht.").max(2000, "Maximaal 2000 tekens."),
});

export type CommentInput = z.infer<typeof commentSchema>;

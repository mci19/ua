import { z } from "zod";

// BE IBAN: BE + 2 check digits + 12 digits, optionally with spaces
const IBAN_REGEX = /^BE\d{14}$/i;

export const ibanSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s+/g, "").toUpperCase())
  .refine((v) => IBAN_REGEX.test(v), {
    message: "Geef een geldig Belgisch IBAN op (BE + 14 cijfers).",
  })
  .refine((v) => isValidIbanMod97(v), { message: "Het IBAN-controlegetal klopt niet." });

function isValidIbanMod97(iban: string): boolean {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged
    .split("")
    .map((c) => (/[A-Z]/.test(c) ? (c.charCodeAt(0) - 55).toString() : c))
    .join("");
  let remainder = 0;
  for (const digit of numeric) {
    remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

// Belgian NRN: YYMMDD-XXX-CD with check digit; 11 digits
const NRN_REGEX = /^\d{11}$/;
export const nationalRegisterNumberSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s.-]/g, ""))
  .refine((v) => NRN_REGEX.test(v), { message: "Het rijksregisternummer moet 11 cijfers bevatten." });

export const referenceYearSchema = z
  .string()
  .regex(/^\d{4}-\d{4}$/, "Gebruik het formaat 2025-2026.")
  .refine((v) => {
    const [a, b] = v.split("-").map(Number);
    return typeof a === "number" && typeof b === "number" && b === a + 1;
  }, "Het tweede jaar moet één meer zijn dan het eerste.");

export const motivationSchema = z
  .string()
  .trim()
  .min(50, "Geef minstens 50 tekens motivatie op.")
  .max(2000, "Beperk je motivatie tot 2000 tekens.");

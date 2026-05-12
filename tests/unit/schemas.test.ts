import { describe, expect, it } from "vitest";
import {
  ibanSchema,
  motivationSchema,
  nationalRegisterNumberSchema,
  referenceYearSchema,
} from "@/lib/schemas/common";

describe("ibanSchema", () => {
  it("accepts a valid BE IBAN (mod-97)", () => {
    // BE68 5390 0754 7034 is the BNB-published BE example IBAN
    expect(ibanSchema.parse("BE68 5390 0754 7034")).toBe("BE68539007547034");
    expect(ibanSchema.parse("be68539007547034")).toBe("BE68539007547034");
  });

  it("rejects a BE IBAN with a bad checksum", () => {
    expect(() => ibanSchema.parse("BE12 3456 7890 1234")).toThrow(/controlegetal/);
  });

  it("rejects non-Belgian IBANs", () => {
    expect(() => ibanSchema.parse("NL91 ABNA 0417 1643 00")).toThrow(/Belgisch/);
  });

  it("rejects garbage", () => {
    expect(() => ibanSchema.parse("not-an-iban")).toThrow();
    expect(() => ibanSchema.parse("")).toThrow();
  });
});

describe("nationalRegisterNumberSchema", () => {
  it("accepts 11 digits", () => {
    expect(nationalRegisterNumberSchema.parse("90010100147")).toBe("90010100147");
  });

  it("strips spaces, dots, dashes", () => {
    expect(nationalRegisterNumberSchema.parse("90.01.01-001.47")).toBe("90010100147");
  });

  it("rejects wrong length", () => {
    expect(() => nationalRegisterNumberSchema.parse("123")).toThrow();
    expect(() => nationalRegisterNumberSchema.parse("123456789012")).toThrow();
  });

  it("rejects letters", () => {
    expect(() => nationalRegisterNumberSchema.parse("9001010014A")).toThrow();
  });
});

describe("referenceYearSchema", () => {
  it("accepts consecutive years", () => {
    expect(referenceYearSchema.parse("2025-2026")).toBe("2025-2026");
  });

  it("rejects non-consecutive years", () => {
    expect(() => referenceYearSchema.parse("2025-2027")).toThrow();
  });

  it("rejects bad format", () => {
    expect(() => referenceYearSchema.parse("2025/2026")).toThrow();
    expect(() => referenceYearSchema.parse("25-26")).toThrow();
  });
});

describe("motivationSchema", () => {
  it("accepts 50-2000 chars", () => {
    const ok = "a".repeat(60);
    expect(motivationSchema.parse(ok)).toBe(ok);
  });

  it("rejects too short", () => {
    expect(() => motivationSchema.parse("kort")).toThrow();
  });

  it("rejects too long", () => {
    expect(() => motivationSchema.parse("a".repeat(2001))).toThrow();
  });
});

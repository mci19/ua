import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { assertGuid } from "@/lib/dataverse/client";
import { ApiError } from "@/lib/utils/errors";

const ORIGINAL = process.env.UA_DEMO_MODE;
afterEach(() => {
  process.env.UA_DEMO_MODE = ORIGINAL;
});

describe("assertGuid", () => {
  beforeEach(() => {
    process.env.UA_DEMO_MODE = "false";
  });

  it("accepts a real GUID", () => {
    const g = "12345678-1234-1234-1234-123456789012";
    expect(assertGuid(g)).toBe(g);
  });

  it("accepts upper- and mixed-case GUIDs", () => {
    const g = "12345678-ABCD-1234-1234-123456789012";
    expect(assertGuid(g)).toBe(g);
  });

  it("rejects OData-injection attempts", () => {
    expect(() => assertGuid("abc' or 1 eq 1")).toThrow(ApiError);
    expect(() => assertGuid("12345678-1234-1234-1234-123456789012 or 1 eq 1")).toThrow();
    expect(() => assertGuid("../../etc/passwd")).toThrow();
  });

  it("rejects empty / non-string inputs", () => {
    expect(() => assertGuid("")).toThrow();
    // @ts-expect-error intentional
    expect(() => assertGuid(undefined)).toThrow();
    // @ts-expect-error intentional
    expect(() => assertGuid(123)).toThrow();
  });

  it("accepts demo-mode synthetic ids only when UA_DEMO_MODE=true", () => {
    process.env.UA_DEMO_MODE = "true";
    expect(assertGuid("contact-anna")).toBe("contact-anna");
    expect(assertGuid("req-demo-101")).toBe("req-demo-101");

    process.env.UA_DEMO_MODE = "false";
    expect(() => assertGuid("contact-anna")).toThrow();
  });

  it("400-codes the rejection", () => {
    try {
      assertGuid("malicious");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(400);
    }
  });
});

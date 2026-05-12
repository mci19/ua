import { describe, expect, it } from "vitest";
import { redact } from "@/lib/utils/logger";

describe("redact", () => {
  it("masks email addresses inside strings", () => {
    expect(redact("user anna@uantwerpen.be did X")).toBe("user [email] did X");
  });

  it("masks GUIDs", () => {
    const g = "12345678-1234-1234-1234-123456789012";
    expect(redact(`request ${g} updated`)).toBe("request [guid] updated");
  });

  it("masks 11-digit NRNs", () => {
    expect(redact("nrn 90010100147 received")).toBe("nrn [nrn] received");
  });

  it("masks Bearer tokens", () => {
    expect(redact("Authorization: Bearer abcDEF123.tok-en"))
      .toBe("Authorization: Bearer [token]");
  });

  it("recursively redacts object fields", () => {
    const input = { user: "anna@uantwerpen.be", id: "12345678-1234-1234-1234-123456789012" };
    const out = redact(input) as Record<string, string>;
    expect(out.user).toBe("[email]");
    expect(out.id).toBe("[guid]");
  });

  it("preserves non-string primitives", () => {
    expect(redact(42)).toBe(42);
    expect(redact(true)).toBe(true);
    expect(redact(null)).toBe(null);
  });

  it("handles arrays", () => {
    expect(redact(["anna@uantwerpen.be", "tom@uantwerpen.be"])).toEqual(["[email]", "[email]"]);
  });
});

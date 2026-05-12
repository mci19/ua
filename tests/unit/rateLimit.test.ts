import { afterEach, describe, expect, it, vi } from "vitest";
import { enforceRateLimit } from "@/lib/api/rateLimit";
import { ApiError } from "@/lib/utils/errors";

afterEach(() => {
  vi.useRealTimers();
});

describe("enforceRateLimit", () => {
  it("allows the first N requests within the capacity", () => {
    const who = `test-burst-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      expect(() => enforceRateLimit("submitRequest", who)).not.toThrow();
    }
  });

  it("throws 429 once the bucket is empty", () => {
    const who = `test-empty-${Math.random()}`;
    for (let i = 0; i < 3; i++) enforceRateLimit("submitRequest", who);
    try {
      enforceRateLimit("submitRequest", who);
      throw new Error("expected to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(429);
      expect((err as ApiError).code).toBe("rate_limited");
    }
  });

  it("refills tokens after the window passes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
    const who = `test-refill-${Math.random()}`;
    for (let i = 0; i < 3; i++) enforceRateLimit("submitRequest", who);
    expect(() => enforceRateLimit("submitRequest", who)).toThrow();
    // submitRequest = 3 capacity / 60s window → wait full window for full refill
    vi.setSystemTime(new Date("2026-01-01T12:01:01Z"));
    expect(() => enforceRateLimit("submitRequest", who)).not.toThrow();
  });

  it("isolates buckets per `who` key", () => {
    const a = `test-a-${Math.random()}`;
    const b = `test-b-${Math.random()}`;
    for (let i = 0; i < 3; i++) enforceRateLimit("submitRequest", a);
    expect(() => enforceRateLimit("submitRequest", b)).not.toThrow();
  });
});

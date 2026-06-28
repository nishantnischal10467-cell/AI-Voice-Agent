import { describe, expect, it } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("blocks requests after the configured limit", () => {
    const key = `test-${crypto.randomUUID()}`;
    expect(rateLimit(key, 1).ok).toBe(true);
    expect(rateLimit(key, 1).ok).toBe(false);
  });
});

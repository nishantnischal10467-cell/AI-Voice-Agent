import { describe, expect, it } from "vitest";
import { querySchema, voiceSchema } from "@/lib/schemas";

describe("request schemas", () => {
  it("accepts valid query payloads", () => {
    expect(querySchema.parse({ query: "What is refund policy?", voice: "coral" })).toEqual({
      query: "What is refund policy?",
      voice: "coral",
    });
  });

  it("rejects unsupported voices", () => {
    expect(() => voiceSchema.parse({ voice: "robot" })).toThrow();
  });
});

import { describe, expect, it } from "vitest";
import { resolvePublicOrigin } from "@/lib/public-origin";

describe("public origin", () => {
  it("keeps localhost for local development", () => {
    expect(resolvePublicOrigin({ appOrigin: "http://localhost:3000", environment: "development" }))
      .toBe("http://localhost:3000");
  });

  it("normalizes the deployed origin", () => {
    expect(resolvePublicOrigin({ appOrigin: "https://saakshya-web.vercel.app/", environment: "production" }))
      .toBe("https://saakshya-web.vercel.app");
  });

  it("rejects localhost in production", () => {
    expect(() => resolvePublicOrigin({ appOrigin: "http://localhost:3000", environment: "production" }))
      .toThrow(/production.*https.*public/i);
  });

  it.each([
    "https://example.com/path",
    "https://example.com/?x=1",
    "https://user:pass@example.com",
    "ftp://example.com",
    "https://127.0.0.1:3000",
  ])("rejects unsafe production origin %s", (appOrigin) => {
    expect(() => resolvePublicOrigin({ appOrigin, environment: "production" })).toThrow();
  });
});

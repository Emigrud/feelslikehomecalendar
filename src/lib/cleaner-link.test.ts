import { describe, expect, it } from "vitest";
import { cleanerLink, isCleanerToken } from "./cleaner-link";

describe("cleaner link", () => {
  it("accepts a 36-char hex code", () => expect(isCleanerToken("a".repeat(36))).toBe(true));
  it("rejects wrong length or characters", () => {
    expect(isCleanerToken("a".repeat(35))).toBe(false);
    expect(isCleanerToken("g".repeat(36))).toBe(false);
    expect(isCleanerToken("' or 1=1 --")).toBe(false);
  });
  it("builds the link", () => expect(cleanerLink("https://x.app/", "ab")).toBe("https://x.app/c/ab"));
});

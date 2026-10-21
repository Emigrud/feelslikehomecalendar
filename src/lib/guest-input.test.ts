import { describe, expect, it } from "vitest";
import { parseAdults, parseKidsAges } from "./guest-input";

describe("parseKidsAges", () => {
  it("reads comma separated ages", () => expect(parseKidsAges("3, 7")).toEqual([3, 7]));
  it("empty means no kids", () => expect(parseKidsAges("  ")).toEqual([]));
  it("rejects adult ages", () => expect(parseKidsAges("4, 18")).toBeNull());
  it("rejects words", () => expect(parseKidsAges("baby")).toBeNull());
});

describe("parseAdults", () => {
  it("empty stays unfilled so the calendar shows ?", () => expect(parseAdults("")).toBeNull());
  it("reads a number", () => expect(parseAdults("2")).toBe(2));
  it("rejects zero", () => expect(parseAdults("0")).toBeUndefined());
});

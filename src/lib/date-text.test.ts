import { describe, expect, it } from "vitest";
import { dateToISO, formatTyping, fromDisplayDate, isoToDate, shiftISO, toDisplayDate } from "./date-text";

describe("toDisplayDate", () => {
  it("shows the database date as yyyy/mm/dd", () => {
    expect(toDisplayDate("2026-11-12")).toBe("2026/11/12");
  });

  it("returns nothing for a missing or malformed date", () => {
    expect(toDisplayDate("")).toBe("");
    expect(toDisplayDate("12/11/2026")).toBe("");
  });
});

describe("formatTyping", () => {
  it("adds slashes as the owner types digits", () => {
    expect(formatTyping("2026")).toBe("2026");
    expect(formatTyping("202611")).toBe("2026/11");
    expect(formatTyping("20261112")).toBe("2026/11/12");
  });

  it("ignores anything that is not a digit and stops at 8 digits", () => {
    expect(formatTyping("2026-11-12")).toBe("2026/11/12");
    expect(formatTyping("2026/11/1299")).toBe("2026/11/12");
  });
});

describe("fromDisplayDate", () => {
  it("reads a full yyyy/mm/dd back into the database date", () => {
    expect(fromDisplayDate("2026/11/12")).toBe("2026-11-12");
  });

  it("also accepts dashes, dots and plain digits", () => {
    expect(fromDisplayDate("2026-11-12")).toBe("2026-11-12");
    expect(fromDisplayDate("2026.11.12")).toBe("2026-11-12");
    expect(fromDisplayDate("20261112")).toBe("2026-11-12");
  });

  it("is incomplete until all 8 digits are there", () => {
    expect(fromDisplayDate("2026/11")).toBeNull();
    expect(fromDisplayDate("2026/11/1")).toBeNull();
  });

  it("rejects impossible months and days", () => {
    expect(fromDisplayDate("2026/13/01")).toBeNull();
    expect(fromDisplayDate("2026/02/30")).toBeNull();
    expect(fromDisplayDate("2026/11/31")).toBeNull();
  });

  it("accepts 29 February in a leap year only", () => {
    expect(fromDisplayDate("2028/02/29")).toBe("2028-02-29");
    expect(fromDisplayDate("2026/02/29")).toBeNull();
  });
});

describe("shiftISO", () => {
  it("crosses month ends and year ends", () => {
    expect(shiftISO("2026-10-31", 1)).toBe("2026-11-01");
    expect(shiftISO("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftISO("2026-11-01", -1)).toBe("2026-10-31");
  });

  it("handles leap years", () => {
    expect(shiftISO("2028-02-28", 1)).toBe("2028-02-29");
    expect(shiftISO("2026-02-28", 1)).toBe("2026-03-01");
  });
});

describe("isoToDate and dateToISO", () => {
  it("round-trips a date without drifting a day", () => {
    expect(dateToISO(isoToDate("2026-11-12"))).toBe("2026-11-12");
    expect(isoToDate("2026-11-12").getDate()).toBe(12);
    expect(isoToDate("2026-11-12").getMonth()).toBe(10);
  });
});

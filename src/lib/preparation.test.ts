import { describe, expect, it } from "vitest";
import { EMPTY_PREP, nextStatus, parseTime, parseTowels, rowToPrep, shownTime } from "./preparation";
import { expandSplits, rowToReservation } from "./reservation-row";

describe("preparation rules", () => {
  it("validates times", () => {
    expect(parseTime("15:00")).toBe("15:00");
    expect(parseTime("9:30")).toBe("09:30");
    expect(parseTime("")).toBeNull();
    expect(parseTime("25:00")).toBeUndefined();
    expect(parseTime("3pm")).toBeUndefined();
  });

  it("validates towel counts", () => {
    expect(parseTowels("4")).toBe(4);
    expect(parseTowels("")).toBeNull();
    expect(parseTowels("-1")).toBeUndefined();
    expect(parseTowels("2.5")).toBeUndefined();
    expect(parseTowels("31")).toBeUndefined();
  });

  it("unknown cot stays distinct from no, and kids do not imply a cot", () => {
    expect(rowToPrep({}).cot).toBe("unknown");
    expect(rowToPrep({ prep_cot: "no" }).cot).toBe("no");
    const r = rowToReservation({ id: "r", source: "airbnb", check_in: "2026-11-01", check_out: "2026-11-03", guest_name: null, adults: 2, kids_ages: [1], comment: null, status: "active", is_blocked: false });
    expect(r.prep.cot).toBe("unknown");
    expect(r.prep.status).toBe("pending");
  });

  it("changing confirmed details returns to pending unless confirmed in the same save", () => {
    const confirmed = { ...EMPTY_PREP, status: "confirmed" as const, beds: ["Sofa bed"] };
    expect(nextStatus(confirmed, { ...confirmed, towels: 3 }, false)).toBe("pending");
    expect(nextStatus(confirmed, { ...confirmed, towels: 3 }, true)).toBe("confirmed");
    expect(nextStatus(confirmed, { ...confirmed }, false)).toBe("confirmed");
  });

  it("time override affects only its booking; otherwise standard time is labelled", () => {
    expect(shownTime("14:00", "15:00")).toEqual({ time: "14:00", standard: false });
    expect(shownTime(null, "15:00")).toEqual({ time: "15:00", standard: true });
    expect(shownTime(null, null)).toEqual({ time: null, standard: false });
  });

  it("each split part keeps its own preparation", () => {
    const parent = rowToReservation({ id: "p", source: "booking", check_in: "2026-11-10", check_out: "2026-11-20", guest_name: null, adults: null, kids_ages: [], comment: null, status: "active", is_blocked: false, prep_towels: 2 });
    const parts = expandSplits(parent, [{ id: "s", reservation_id: "p", start_date: "2026-11-14", guest_name: null, adults: null, kids_ages: [], comment: null, prep_towels: 5, prep_cot: "yes" }]);
    expect(parts[0]!.prep.towels).toBe(2);
    expect(parts[1]!.prep.towels).toBe(5);
    expect(parts[1]!.prep.cot).toBe("yes");
    expect(parts[0]!.prep.cot).toBe("unknown");
  });
});

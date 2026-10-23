import { describe, it, expect } from "vitest";
import { rowToReservation } from "./reservation-row";

describe("rowToReservation", () => {
  it("maps fields and keeps missing guest count as null", () => {
    const r = rowToReservation({
      id: "x", source: "booking", check_in: "2026-10-01", check_out: "2026-10-04",
      guest_name: null, adults: null, kids_ages: null, comment: null, status: "active", is_blocked: false,
    });
    expect(r).toMatchObject({ source: "booking", checkIn: "2026-10-01", checkOut: "2026-10-04", adults: null, kidsAges: [], status: "active" });
  });
  it("keeps cancelled status", () => {
    const r = rowToReservation({
      id: "y", source: "airbnb", check_in: "2026-10-01", check_out: "2026-10-02",
      guest_name: "A", adults: 2, kids_ages: [3], comment: "c", status: "cancelled", is_blocked: true,
    });
    expect(r.status).toBe("cancelled");
    expect(r.isBlocked).toBe(true);
  });
  it("owner's 'booking' choice beats a synced block and its source", () => {
    const r = rowToReservation({
      id: "z", source: "airbnb", check_in: "2026-11-10", check_out: "2026-11-20",
      guest_name: null, adults: null, kids_ages: null, comment: null, status: "active", is_blocked: true,
      owner_kind: "booking", owner_source: "booking",
    });
    expect(r.isBlocked).toBe(false);
    expect(r.source).toBe("booking");
  });
  it("owner's 'blocked' choice beats a synced booking", () => {
    const r = rowToReservation({
      id: "w", source: "airbnb", check_in: "2026-11-10", check_out: "2026-11-20",
      guest_name: null, adults: null, kids_ages: null, comment: null, status: "active", is_blocked: false, owner_kind: "blocked",
    });
    expect(r.isBlocked).toBe(true);
  });
});

import { expandSplits, isValidSplitDate } from "./reservation-row";
describe("split stays", () => {
  const base = { id: "r1", source: "booking" as const, checkIn: "2026-11-10", checkOut: "2026-11-20", status: "active" as const, isBlocked: false, adults: 2 };
  const split = (d: string) => ({ id: "s-" + d, reservation_id: "r1", start_date: d, guest_name: null, adults: null, kids_ages: [], comment: null });
  it("splitting 10–20 Nov at 14 Nov gives 10–14 and 14–20", () => {
    const p = expandSplits(base, [split("2026-11-14")]);
    expect(p.map((x) => [x.checkIn, x.checkOut])).toEqual([["2026-11-10", "2026-11-14"], ["2026-11-14", "2026-11-20"]]);
    expect(p[0]!.adults).toBe(2);
    expect(p[1]!.adults).toBeNull();
  });
  it("rejects a date outside the stay", () => {
    expect(isValidSplitDate(base, "2026-11-10")).toBe(false);
    expect(isValidSplitDate(base, "2026-11-21")).toBe(false);
    expect(isValidSplitDate(base, "2026-11-15")).toBe(true);
  });
  it("ignores splits left outside new dates", () => {
    expect(expandSplits({ ...base, checkOut: "2026-11-12" }, [split("2026-11-14")])).toHaveLength(1);
  });
});

import { dayInfo } from "./calendar";
describe("blocking one part of a split stay", () => {
  const stay = { id: "r2", source: "booking" as const, checkIn: "2026-10-24", checkOut: "2026-10-26", status: "active" as const, isBlocked: false };
  const s = { id: "s1", reservation_id: "r2", start_date: "2026-10-25", guest_name: null, adults: null, kids_ages: [], comment: null, is_blocked: true };
  it("24–26 split at 25 with the second part blocked: check-in 24, check-out + block 25", () => {
    const parts = expandSplits(stay, [s]);
    expect(dayInfo("2026-10-24", parts).kind).toBe("checkin");
    expect(dayInfo("2026-10-25", parts).kind).toBe("checkout-blocked");
  });
  it("blocking one part leaves the other part a booking", () => {
    const parts = expandSplits(stay, [s]);
    expect(parts.map((p) => p.isBlocked)).toEqual([false, true]);
  });
});

import { describe, expect, it } from "vitest";
import type { Reservation } from "./calendar";
import { buildCleanings } from "./cleanings";

const r = (o: Partial<Reservation>): Reservation => ({ id: "x", source: "airbnb", checkIn: "2026-11-01", checkOut: "2026-11-03", status: "active", isBlocked: false, ...o });

describe("cleanings list", () => {
  it("same-day changeover keeps departing and arriving notes on their own bookings", () => {
    const a = r({ id: "a", checkIn: "2026-11-01", checkOut: "2026-11-03", checkOutComment: "OUT", checkInComment: "a-in" });
    const b = r({ id: "b", checkIn: "2026-11-03", checkOut: "2026-11-05", checkInComment: "IN" });
    const [first] = buildCleanings([a, b]);
    expect(first!.sameDay).toBe(true);
    expect(first!.departure.checkOutComment).toBe("OUT");
    expect(first!.next?.checkInComment).toBe("IN");
  });

  it("blocks do not create cleanings and are not a next arrival", () => {
    const a = r({ id: "a" });
    const blk = r({ id: "blk", isBlocked: true, checkIn: "2026-11-03", checkOut: "2026-11-06" });
    const items = buildCleanings([a, blk]);
    expect(items).toHaveLength(1);
    expect(items[0]!.next).toBeNull();
  });

  it("a gap allows a plan inside the window; cancelled stays are ignored", () => {
    const a = r({ id: "a", cleaningDate: "2026-11-04" });
    const b = r({ id: "b", checkIn: "2026-11-06", checkOut: "2026-11-08" });
    const c = r({ id: "c", status: "cancelled", checkIn: "2026-11-03", checkOut: "2026-11-04" });
    const [first] = buildCleanings([a, b, c]);
    expect(first!.next?.id).toBe("b");
    expect(first!.sameDay).toBe(false);
    expect(first!.planInvalid).toBe(false);
  });

  it("changed dates flag a plan that no longer fits, without dropping it", () => {
    const a = r({ id: "a", cleaningDate: "2026-11-02", cleaningTime: "11:00" });
    const [first] = buildCleanings([a]);
    expect(first!.plan).toEqual({ date: "2026-11-02", time: "11:00" });
    expect(first!.planInvalid).toBe(true);
    const late = buildCleanings([r({ id: "a", cleaningDate: "2026-11-07" }), r({ id: "b", checkIn: "2026-11-05", checkOut: "2026-11-09" })]);
    expect(late[0]!.planInvalid).toBe(true);
  });

  it("overlapping stays are flagged as uncertain", () => {
    const items = buildCleanings([r({ id: "a", checkIn: "2026-11-01", checkOut: "2026-11-05" }), r({ id: "b", checkIn: "2026-11-03", checkOut: "2026-11-04" })]);
    expect(items.every((i) => i.overlap)).toBe(true);
  });

  it("a synced stay fully covered by a hand-added booking does not create its own cleaning", () => {
    const items = buildCleanings([r({ id: "m", isManual: true, checkIn: "2026-10-27", checkOut: "2026-10-31" }), r({ id: "s", checkIn: "2026-10-27", checkOut: "2026-10-30" })]);
    expect(items.map((i) => i.id)).toEqual(["m"]);
    expect(items[0]!.overlap).toBe(false);
  });
});

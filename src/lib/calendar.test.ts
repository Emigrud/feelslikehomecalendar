import { describe, it, expect } from "vitest";
import { dayInfo, guestLabel, monthGrid, nights, type Reservation } from "./calendar";

const r = (o: Partial<Reservation>): Reservation => ({
  id: Math.random().toString(), source: "airbnb", checkIn: "2026-10-10", checkOut: "2026-10-13",
  status: "active", isBlocked: false, ...o,
});

describe("calendar rules", () => {
  it("week starts on Monday", () => {
    // Oct 1 2026 is a Thursday -> grid starts Mon Sep 28
    expect(monthGrid(2026, 9)[0]?.getDate()).toBe(28);
  });
  it("check-in day is green kind", () => expect(dayInfo("2026-10-10", [r({})]).kind).toBe("checkin"));
  it("check-out day is red kind", () => expect(dayInfo("2026-10-13", [r({})]).kind).toBe("checkout"));
  it("middle of stay is staying", () => expect(dayInfo("2026-10-11", [r({})]).kind).toBe("staying"));
  it("same-day out+in is changeover, check-out listed first", () => {
    const a = r({ id: "a" }), b = r({ id: "b", checkIn: "2026-10-13", checkOut: "2026-10-15" });
    const info = dayInfo("2026-10-13", [b, a]);
    expect(info.kind).toBe("changeover");
    expect(info.reservations.map((x) => x.id)).toEqual(["a", "b"]);
  });
  it("cancelled reservations are hidden", () => expect(dayInfo("2026-10-10", [r({ status: "cancelled" })]).kind).toBe("empty"));
  it("blocked days are blocked", () => expect(dayInfo("2026-10-11", [r({ isBlocked: true })]).kind).toBe("blocked"));
  it("guest label shows ? until adults filled in", () => {
    expect(guestLabel(r({}))).toBe("?");
    expect(guestLabel(r({ adults: 2, kidsAges: [4] }))).toBe("2+1");
    expect(guestLabel(r({ adults: 2, kidsAges: [] }))).toBe("2");
  });
  it("hides an Airbnb block that mirrors a Booking.com stay", () => {
    const info = dayInfo("2026-11-12", [r({ id: "a", isBlocked: true, checkIn: "2026-11-10", checkOut: "2026-11-20" }), r({ id: "b", source: "booking", isBlocked: true, ownerKind: "blocked", checkIn: "2026-11-10", checkOut: "2026-11-20" })]);
    expect(info.reservations.map((x) => x.id)).toEqual(["b"]);
  });
  it("counts nights", () => expect(nights(r({}))).toBe(3));
});

describe("owner-added booking inside a synced stay", () => {
  const synced = r({ id: "s", source: "booking", checkIn: "2026-11-10", checkOut: "2026-11-20" });
  const mine = r({ id: "m", checkIn: "2026-11-14", checkOut: "2026-11-17", isManual: true });
  it("its check-in day is a changeover", () => {
    const i = dayInfo("2026-11-14", [synced, mine]);
    expect(i.kind).toBe("changeover");
    expect(i.checkIn?.id).toBe("m");
  });
  it("its middle days show the owner's guest", () => expect(dayInfo("2026-11-15", [synced, mine]).staying?.id).toBe("m"));
  it("after it ends the synced stay shows again", () => expect(dayInfo("2026-11-18", [synced, mine]).staying?.id).toBe("s"));
});

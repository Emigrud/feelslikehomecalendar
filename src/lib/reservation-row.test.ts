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

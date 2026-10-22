import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { syncApartment } from "./calendar-sync.server";
import { downloadFeed } from "./ical-feed";
vi.mock("./ical-feed", () => ({ downloadFeed: vi.fn() }));
const event = { external_uid: "one", check_in: "2026-10-22", check_out: "2026-10-25", is_blocked: false, status: "active" as const };
describe("safe sync", () => {
  beforeEach(() => vi.resetAllMocks());
  function client() {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn((_values: Record<string, unknown>) => ({ eq }));
    const rpc = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ update }));
    return { db: { rpc, from } as unknown as SupabaseClient<Database>, rpc, update };
  }
  const apartment = { id: "apt", airbnb_ical_url: "https://www.airbnb.com/calendar", booking_ical_url: null };
  it("sends only imported fields, never owner guest details", async () => {
    vi.mocked(downloadFeed).mockResolvedValue([event]);
    const c = client();
    await syncApartment(c.db, apartment);
    expect(c.rpc).toHaveBeenCalledWith("apply_calendar_feed", { p_apartment_id: "apt", p_source: "airbnb", p_url: apartment.airbnb_ical_url, p_events: [event] });
    const fields = Object.keys(c.rpc.mock.calls[0]?.[1].p_events[0] ?? {});
    expect(fields).not.toContain("adults"); expect(fields).not.toContain("kids_ages"); expect(fields).not.toContain("guest_name"); expect(fields).not.toContain("comment");
  });
  it("does not apply or cancel anything when download fails", async () => {
    vi.mocked(downloadFeed).mockRejectedValue(new Error("failure"));
    const c = client();
    await syncApartment(c.db, apartment);
    expect(c.rpc).not.toHaveBeenCalled();
    expect(c.update.mock.calls[0]?.[0]).not.toHaveProperty("last_synced_at");
  });
  it("continues the second platform when the first fails", async () => {
    vi.mocked(downloadFeed).mockRejectedValueOnce(new Error("failure")).mockResolvedValueOnce([event]);
    const c = client();
    const result = await syncApartment(c.db, { ...apartment, booking_ical_url: "https://admin.booking.com/calendar" });
    expect(c.rpc).toHaveBeenCalledTimes(1);
    expect(c.rpc.mock.calls[0]?.[1].p_source).toBe("booking");
    expect(result.error).toContain("Airbnb");
  });
});
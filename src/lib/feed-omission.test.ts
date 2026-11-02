import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const db = new PGlite();
const apartmentId = "44b1bde1-7793-48f1-a04a-fa8dba1f5c95";
const restoredId = "7f1f9289-4332-423f-a93e-86dc3b1d8ef6";
const uid = "d0d619776d77857330b40acc9680b15d@booking.com";

describe("owner-confirmed restored booking", () => {
  beforeAll(async () => {
    await db.exec(`
      CREATE TABLE public.apartments (id uuid PRIMARY KEY, airbnb_ical_url text, booking_ical_url text);
      CREATE TABLE public.reservations (
        id uuid PRIMARY KEY, apartment_id uuid, source text, external_uid text,
        check_in date, check_out date, is_blocked boolean, status text,
        guest_name text, adults integer, updated_at timestamptz,
        UNIQUE(apartment_id, source, external_uid)
      );
      INSERT INTO public.apartments VALUES ('${apartmentId}', NULL, 'https://admin.booking.com/test');
    `);
    await db.exec(readFileSync(new URL("../../drizzle/migrations/0011_protect_restored_bookings_from_feed_omission.sql", import.meta.url), "utf8"));
    await db.exec(`INSERT INTO public.reservations
      (id, apartment_id, source, external_uid, check_in, check_out, is_blocked, status, guest_name, adults, preserve_on_feed_omission)
      VALUES ('${restoredId}', '${apartmentId}', 'booking', '${uid}', '2026-11-02', '2026-11-03', false, 'active', 'valsala saniya', 1, true),
      ('00000000-0000-0000-0000-000000000001', '${apartmentId}', 'booking', 'ordinary', '2026-11-04', '2026-11-05', false, 'active', NULL, NULL, false);`);
  }, 30000);
  afterAll(() => db.close());

  it("keeps valsala saniya's 2–3 November departure when Booking.com omits it", async () => {
    await db.query("SELECT public.apply_calendar_feed($1, 'booking', 'https://admin.booking.com/test', '[]'::jsonb)", [apartmentId]);
    const result = await db.query("SELECT status, check_in::text, check_out::text, guest_name, adults FROM public.reservations WHERE id = $1", [restoredId]);
    expect(result.rows[0]).toEqual({ status: "active", check_in: "2026-11-02", check_out: "2026-11-03", guest_name: "valsala saniya", adults: 1 });
    const ordinary = await db.query("SELECT status FROM public.reservations WHERE external_uid = 'ordinary'");
    expect(ordinary.rows[0]).toEqual({ status: "cancelled" });
  });

  it("still honours an explicit Booking.com cancellation", async () => {
    const events = [{ external_uid: uid, check_in: "2026-11-02", check_out: "2026-11-03", is_blocked: false, status: "cancelled" }];
    await db.query("SELECT public.apply_calendar_feed($1, 'booking', 'https://admin.booking.com/test', $2::jsonb)", [apartmentId, JSON.stringify(events)]);
    const result = await db.query("SELECT status, preserve_on_feed_omission, guest_name FROM public.reservations WHERE id = $1", [restoredId]);
    expect(result.rows[0]).toEqual({ status: "cancelled", preserve_on_feed_omission: true, guest_name: "valsala saniya" });
  });
});
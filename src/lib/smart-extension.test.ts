import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const db = new PGlite();
const apt = "44b1bde1-7793-48f1-a04a-fa8dba1f5c95";
const parent = "00000000-0000-0000-0000-000000000001";
const migration = readdirSync("drizzle/migrations").find((f) => f.endsWith("smart_booking_extensions.sql"));
if (!migration) throw new Error("Smart extension migration is missing");
const sql = readFileSync(`drizzle/migrations/${migration}`, "utf8");
const feed = (end = "2099-11-26", status = "active") => [{ external_uid: "merged", check_in: "2099-11-07", check_out: end, is_blocked: false, status }];
const sync = (events = feed()) => db.query("SELECT apply_calendar_feed($1, 'booking', 'https://admin.booking.com/test', $2::jsonb)", [apt, JSON.stringify(events)]);

describe("Smart Booking.com extensions", () => {
  beforeAll(async () => {
    await db.exec(`CREATE TABLE apartments(id uuid PRIMARY KEY, airbnb_ical_url text, booking_ical_url text);
      CREATE TABLE reservations(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), apartment_id uuid, source text, external_uid text,
        check_in date, check_out date, owner_check_in date, owner_check_out date, owner_kind text, is_blocked boolean,
        status text, guest_name text, comment text, updated_at timestamptz, preserve_on_feed_omission boolean DEFAULT false,
        UNIQUE(apartment_id, source, external_uid));
      CREATE TABLE reservation_splits(id uuid DEFAULT gen_random_uuid(), reservation_id uuid, start_date date, comment text);
      INSERT INTO apartments VALUES ('${apt}', NULL, 'https://admin.booking.com/test');`);
    await db.exec(sql);
  }, 30000);
  afterAll(() => db.close());
  beforeEach(async () => {
    await db.exec(`DELETE FROM reservation_splits; DELETE FROM reservations WHERE apartment_id = '${apt}';
      INSERT INTO reservations(id, apartment_id, source, external_uid, check_in, check_out, owner_check_in, owner_check_out, owner_kind, is_blocked, status, comment)
      VALUES('${parent}', '${apt}', 'booking', 'merged', '2099-11-07', '2099-11-22', '2099-11-07', '2099-11-10', 'blocked', false, 'active', 'Keep my block');
      INSERT INTO reservations(apartment_id, source, external_uid, check_in, check_out, is_blocked, status, guest_name, comment)
      VALUES('${apt}', 'booking', 'manual-Christina', '2099-11-10', '2099-11-12', false, 'active', 'Christina', 'C'),
      ('${apt}', 'booking', 'manual-Pawel', '2099-11-12', '2099-11-20', false, 'active', 'Pawel', 'P'),
      ('${apt}', 'booking', 'manual-Sanita', '2099-11-20', '2099-11-22', false, 'active', 'Sanita', 'S');`);
  });
  async function extensions() {
    return (await db.query<{ start: string; end: string; status: string }>("SELECT check_in::text AS start, check_out::text AS end, status FROM reservations WHERE extension_parent_id IS NOT NULL ORDER BY check_in")).rows;
  }
  it("7–22 growing to 7–26 creates 22–26 and preserves owner data", async () => {
    await sync();
    expect(await extensions()).toEqual([{ start: "2099-11-22", end: "2099-11-26", status: "active" }]);
    expect((await db.query("SELECT owner_check_out::text, owner_kind, comment FROM reservations WHERE id = $1", [parent])).rows[0]).toEqual({ owner_check_out: "2099-11-10", owner_kind: "blocked", comment: "Keep my block" });
    expect((await db.query("SELECT guest_name, comment FROM reservations WHERE external_uid LIKE 'manual-%' ORDER BY check_in")).rows).toEqual([{ guest_name: "Christina", comment: "C" }, { guest_name: "Pawel", comment: "P" }, { guest_name: "Sanita", comment: "S" }]);
  });
  it("recovers the already-hidden 22–26 tail on first sync", async () => {
    await db.query("UPDATE reservations SET check_out = '2099-11-26' WHERE id = $1", [parent]);
    await sync();
    expect(await extensions()).toEqual([{ start: "2099-11-22", end: "2099-11-26", status: "active" }]);
  });
  it("unchanged sync neither duplicates dates nor resets an edited extension", async () => {
    await sync();
    await db.exec("UPDATE reservations SET owner_check_out = '2099-11-25', comment = 'My note' WHERE extension_parent_id IS NOT NULL");
    await sync();
    expect(await extensions()).toHaveLength(1);
    expect((await db.query("SELECT owner_check_out::text, comment FROM reservations WHERE extension_parent_id IS NOT NULL")).rows[0]).toEqual({ owner_check_out: "2099-11-25", comment: "My note" });
  });
  it("adds only further new dates and subtracts manual blocks", async () => {
    await sync();
    await db.exec(`INSERT INTO reservations(apartment_id, source, external_uid, check_in, check_out, is_blocked, status)
      VALUES('${apt}', 'airbnb', 'manual-block', '2099-11-27', '2099-11-28', true, 'active')`);
    await sync(feed("2099-11-29"));
    expect(await extensions()).toEqual([
      { start: "2099-11-22", end: "2099-11-26", status: "active" },
      { start: "2099-11-26", end: "2099-11-27", status: "active" },
      { start: "2099-11-28", end: "2099-11-29", status: "active" },
    ]);
  });
  it("keeps split comments and parent boundaries on extension", async () => {
    await db.exec(`INSERT INTO reservation_splits(reservation_id, start_date, comment) VALUES('${parent}', '2099-11-09', 'Split note')`);
    await sync();
    expect((await db.query("SELECT check_out::text FROM reservations WHERE id = $1", [parent])).rows[0]).toEqual({ check_out: "2099-11-22" });
    expect((await db.query("SELECT comment FROM reservation_splits")).rows).toEqual([{ comment: "Split note" }]);
  });
  it("explicit cancellation cancels extensions but not manual stays", async () => {
    await sync(); await sync(feed("2099-11-26", "cancelled"));
    expect((await extensions())[0]?.status).toBe("cancelled");
    expect((await db.query("SELECT count(*)::integer AS n FROM reservations WHERE external_uid LIKE 'manual-%' AND status = 'active'")).rows[0]).toEqual({ n: 3 });
  });
  it("a missing future parent cancels its future extensions", async () => {
    await sync(); await sync([]);
    expect((await extensions())[0]?.status).toBe("cancelled");
  });
});
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/integrations/supabase/types";
import type { Source } from "./calendar";
import { downloadFeed } from "./ical-feed";

type Apartment = Pick<Tables<"apartments">, "id" | "airbnb_ical_url" | "booking_ical_url">;

export async function syncApartment(client: SupabaseClient<Database>, apartment: Apartment) {
  const feeds: { source: Source; url: string | null }[] = [
    { source: "airbnb", url: apartment.airbnb_ical_url },
    { source: "booking", url: apartment.booking_ical_url },
  ];
  const errors: string[] = [];
  let imported = 0, connected = 0;
  for (const { source, url } of feeds) {
    if (!url) continue;
    connected++;
    try {
      const events = await downloadFeed(url, source);
      const { error } = await client.rpc("apply_calendar_feed", { p_apartment_id: apartment.id, p_source: source, p_url: url, p_events: events });
      if (error) throw error;
      imported += events.filter((e) => e.status === "active").length;
    } catch {
      errors.push(`${source === "airbnb" ? "Airbnb" : "Booking.com"}: couldn't sync. Check the calendar export link and try again.`);
    }
  }
  if (!connected) return { imported: 0, error: "Add a calendar link in Settings first." };
  const error = errors.length ? errors.join(" ") : null;
  const update = await client.from("apartments").update({ last_sync_error: error, ...(!error ? { last_synced_at: new Date().toISOString() } : {}) }).eq("id", apartment.id);
  if (update.error) throw new Error("Could not save sync status. Please try again.");
  return { imported, error };
}
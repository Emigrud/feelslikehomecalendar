import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { validateFeedUrl } from "./ical-feed";

export const getCalendarSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("apartments")
      .select("id, name, airbnb_ical_url, booking_ical_url, last_synced_at, last_sync_error, bed_options, std_checkin_time, std_checkout_time, timezone")
      .eq("owner_id", context.userId).single();
    if (error) throw new Error("Could not load settings. Open your calendar first, then try again.");
    return data;
  });

export const saveCalendarSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ name: z.string().trim().min(1, "Enter an apartment name.").max(100), airbnb: z.string().max(2048), booking: z.string().max(2048),
    bedOptions: z.array(z.string().trim().min(1).max(40)).max(10),
    checkIn: z.string().trim().regex(/^(([01]\d|2[0-3]):[0-5]\d)?$/, "Standard check-in: use HH:MM, e.g. 15:00."),
    checkOut: z.string().trim().regex(/^(([01]\d|2[0-3]):[0-5]\d)?$/, "Standard check-out: use HH:MM, e.g. 12:00.") }))
  .handler(async ({ data, context }) => {
    const airbnb = validateFeedUrl(data.airbnb, "airbnb");
    const booking = validateFeedUrl(data.booking, "booking");
    const { error, data: saved } = await context.supabase.from("apartments").update({ name: data.name, airbnb_ical_url: airbnb || null, booking_ical_url: booking || null, bed_options: data.bedOptions, std_checkin_time: data.checkIn || null, std_checkout_time: data.checkOut || null })
      .eq("owner_id", context.userId).select("id").single();
    if (error || !saved) throw new Error("Could not save settings. Please try again.");
    return { saved: true };
  });

export const syncOwnerCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("apartments").select("id, airbnb_ical_url, booking_ical_url").eq("owner_id", context.userId).single();
    if (error || !data) throw new Error("Could not load calendar links.");
    const { syncApartment } = await import("./calendar-sync.server");
    return syncApartment(context.supabase, data);
  });
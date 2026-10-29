import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { expandSplits, rowToReservation } from "./reservation-row";
import { aptTimes } from "./preparation";
import { isCleanerToken } from "./cleaner-link";

const RES_COLS = "id, source, external_uid, check_in, check_out, guest_name, adults, kids_ages, comment, checkin_comment, checkout_comment, status, is_blocked, owner_kind, owner_source, first_part_blocked, owner_check_in, owner_check_out, prep_beds, prep_bed_note, prep_cot, prep_towels, prep_status, checkin_time, checkout_time, arrival_time";
const SPLIT_COLS = "id, reservation_id, start_date, guest_name, adults, kids_ages, comment, checkin_comment, checkout_comment, is_blocked, prep_beds, prep_bed_note, prep_cot, prep_towels, prep_status, checkin_time, checkout_time, arrival_time";

/** Public, read-only: the private link code is the only key. Never returns feed links or the code. */
export const getCleanerCalendar = createServerFn({ method: "GET" })
  .inputValidator((input: { token: string }) => {
    if (!input || typeof input.token !== "string" || !isCleanerToken(input.token)) throw new Error("This link is not valid.");
    return { token: input.token };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: apt } = await supabaseAdmin.from("apartments").select("id, name, bed_options, std_checkin_time, std_checkout_time, timezone").eq("cleaner_token", data.token).maybeSingle();
    if (!apt) throw new Error("This link is not valid any more. Ask the owner for a new one.");
    const res = await supabaseAdmin.from("reservations").select(RES_COLS).eq("apartment_id", apt.id).order("check_in");
    if (res.error) throw new Error("Could not load the calendar.");
    const ids = (res.data ?? []).map((r) => r.id);
    const sp = ids.length ? await supabaseAdmin.from("reservation_splits").select(SPLIT_COLS).in("reservation_id", ids) : { data: [], error: null };
    if (sp.error) throw new Error("Could not load the calendar.");
    return { name: apt.name, times: aptTimes(apt), reservations: (res.data ?? []).flatMap((r) => expandSplits(rowToReservation(r), sp.data ?? [])) };
  });

export const getCleanerToken = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("apartments").select("cleaner_token").eq("owner_id", context.userId).single();
    if (error || !data) throw new Error("Could not load the cleaner link.");
    return { token: data.cleaner_token };
  });

export const regenerateCleanerToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const bytes = crypto.getRandomValues(new Uint8Array(18));
    const token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    const { data, error } = await context.supabase.from("apartments").update({ cleaner_token: token }).eq("owner_id", context.userId).select("cleaner_token").single();
    if (error || !data) throw new Error("Could not make a new link.");
    return { token: data.cleaner_token };
  });

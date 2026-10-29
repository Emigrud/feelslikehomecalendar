import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { expandSplits, rowToReservation } from "./reservation-row";
import { PREP_COLS, aptTimes } from "./preparation";

/** Load (or create on first sign-in) the owner's apartment with its reservations. */
async function loadApartment() {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not signed in");
  const uid = userData.user.id;

  let { data: apt, error } = await supabase.from("apartments").select("id, name, bed_options, std_checkin_time, std_checkout_time, timezone").eq("owner_id", uid).maybeSingle();
  if (error) throw error;
  if (!apt) {
    const ins = await supabase.from("apartments").insert({ owner_id: uid }).select("id, name, bed_options, std_checkin_time, std_checkout_time, timezone").single();
    if (ins.error) throw ins.error;
    apt = ins.data;
  }

  const res = await supabase
    .from("reservations")
    .select("id, source, external_uid, check_in, check_out, guest_name, adults, kids_ages, comment, checkin_comment, checkout_comment, status, is_blocked, owner_kind, owner_source, first_part_blocked, owner_check_in, owner_check_out, " + PREP_COLS)
    .eq("apartment_id", apt.id)
    .order("check_in");
  if (res.error) throw res.error;

  const sp = await supabase.from("reservation_splits").select("id, reservation_id, start_date, guest_name, adults, kids_ages, comment, checkin_comment, checkout_comment, is_blocked, " + PREP_COLS);
  if (sp.error) throw sp.error;

  return { id: apt.id, name: apt.name, times: aptTimes(apt), reservations: (res.data ?? []).flatMap((r) => expandSplits(rowToReservation(r), sp.data ?? [])) };
}

export const apartmentQuery = queryOptions({ queryKey: ["apartment"], queryFn: loadApartment });

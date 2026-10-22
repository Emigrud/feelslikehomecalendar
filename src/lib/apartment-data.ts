import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { rowToReservation } from "./reservation-row";

/** Load (or create on first sign-in) the owner's apartment with its reservations. */
async function loadApartment() {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not signed in");
  const uid = userData.user.id;

  let { data: apt, error } = await supabase.from("apartments").select("id, name").eq("owner_id", uid).maybeSingle();
  if (error) throw error;
  if (!apt) {
    const ins = await supabase.from("apartments").insert({ owner_id: uid }).select("id, name").single();
    if (ins.error) throw ins.error;
    apt = ins.data;
  }

  const res = await supabase
    .from("reservations")
    .select("id, source, check_in, check_out, guest_name, adults, kids_ages, comment, status, is_blocked, owner_kind, owner_source")
    .eq("apartment_id", apt.id)
    .order("check_in");
  if (res.error) throw res.error;

  return { id: apt.id, name: apt.name, reservations: (res.data ?? []).map(rowToReservation) };
}

export const apartmentQuery = queryOptions({ queryKey: ["apartment"], queryFn: loadApartment });
